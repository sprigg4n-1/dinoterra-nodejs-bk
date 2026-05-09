import mongoose from "mongoose";
import FormData from "form-data";
import fetch from "node-fetch";

import Prediction from "../models/prediction.model.js";
import PredictionImage from "../models/predictionImage.model.js";
import ModelStats from "../models/modelStats.model.js";

const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";

// ── Хелпер: парсимо Base64 з префіксом або без ───────────────────────────────
const parseBase64 = (file) => {
  if (file.includes(",")) {
    const [meta, data] = file.split(",");
    const mimeType = meta.match(/:(.*?);/)?.[1] || "image/jpeg";
    return { base64: data, mimeType };
  }
  return { base64: file, mimeType: "image/jpeg" };
};

// ── Хелпер: відправити Base64 до ML API ──────────────────────────────────────
const sendBase64ToML = async (endpoint, base64, mimeType) => {
  const buffer = Buffer.from(base64, "base64");
  const form = new FormData();
  form.append("file", buffer, {
    filename: "image.jpg",
    contentType: mimeType || "image/jpeg",
  });

  const response = await fetch(`${ML_API_URL}${endpoint}`, {
    method: "POST",
    body: form,
  });

  return response.json();
};

// ── Хелпер: отримати або створити stats ──────────────────────────────────────
const getOrCreateStats = async () => {
  let stats = await ModelStats.findOne();
  if (!stats) stats = await ModelStats.create({});
  return stats;
};

// ── 1. USER CLASSIFY ──────────────────────────────────────────────────────────
export const classify = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { file } = req.body;

    if (!file) {
      const error = new Error("File is required");
      error.status = 400;
      throw error;
    }

    const { base64, mimeType } = parseBase64(file);
    console.log("Відправляємо до ML...");
    const mlResult = await sendBase64ToML("/predict", base64, mimeType);
    console.log("ML результат:", mlResult);

    if (mlResult.error) {
      const error = new Error(mlResult.error);
      error.status = 500;
      throw error;
    }

    const newPredictions = await Prediction.create(
      [
        {
          predictionId: mlResult.prediction_id,
          user: req.user?._id || null,
          isDinosaur: mlResult.is_dinosaur,
          stage1Probability: mlResult.stage1_probability,
          top3: mlResult.top3,
          feedback: null,
        },
      ],
      { session },
    );

    await PredictionImage.create(
      [
        {
          file,
          mimeType,
          prediction: newPredictions[0]._id,
          usedForRetrain: false,
        },
      ],
      { session },
    );

    await ModelStats.findOneAndUpdate(
      {},
      { $inc: { totalPredictions: 1 } },
      { upsert: true, session },
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      data: newPredictions[0],
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// ── 2. USER FEEDBACK ──────────────────────────────────────────────────────────
export const giveFeedback = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { isCorrect, correctRank, correctClass, givenBy = "USER" } = req.body;

    const prediction = await Prediction.findById(id).session(session);

    if (!prediction) {
      const error = new Error("Prediction not found");
      error.status = 404;
      throw error;
    }

    if (prediction.feedback) {
      const error = new Error("Feedback already given");
      error.status = 409;
      throw error;
    }

    prediction.feedback = {
      isCorrect,
      correctRank: correctRank || null,
      correctClass: correctClass || null,
      givenBy,
      givenAt: new Date(),
    };

    await prediction.save({ session });

    const statsInc = { totalFeedback: 1 };

    if (isCorrect) {
      statsInc.correctFeedback = 1;
      if (correctRank === 1) statsInc["rankStats.top1"] = 1;
      if (correctRank === 2) statsInc["rankStats.top2"] = 1;
      if (correctRank === 3) statsInc["rankStats.top3"] = 1;
    } else if (correctClass) {
      statsInc.wrongFeedback = 1;
      statsInc.pendingRetrain = 1;
    } else {
      statsInc.wrongFeedback = 1;
      statsInc.unknownFeedback = 1;
    }

    await ModelStats.findOneAndUpdate(
      {},
      { $inc: statsInc },
      { upsert: true, session },
    );

    // Якщо помилилась і юзер вказав клас — відправляємо фото до ML
    if (!isCorrect && correctClass) {
      const predImage = await PredictionImage.findOne({
        prediction: prediction._id,
      });

      if (predImage) {
        const { base64 } = parseBase64(predImage.file);
        const buffer = Buffer.from(base64, "base64");
        const form = new FormData();
        form.append("file", buffer, {
          filename: "image.jpg",
          contentType: predImage.mimeType,
        });
        form.append("prediction_id", prediction.predictionId);
        form.append("correct_class", correctClass);

        await fetch(`${ML_API_URL}/feedback`, {
          method: "POST",
          body: form,
        });

        // Позначаємо що фото використано для перенавчання
        await PredictionImage.findByIdAndUpdate(predImage._id, {
          usedForRetrain: true,
        });
      }
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Feedback saved successfully",
      data: prediction,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// ── 3. ADMIN CLASSIFY ─────────────────────────────────────────────────────────
export const adminClassify = async (req, res, next) => {
  try {
    const { file } = req.body;

    if (!file) {
      const error = new Error("File is required");
      error.status = 400;
      throw error;
    }

    const { base64, mimeType } = parseBase64(file);
    const mlResult = await sendBase64ToML("/admin/predict", base64, mimeType);

    if (mlResult.error) {
      const error = new Error(mlResult.error);
      error.status = 500;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: mlResult,
    });
  } catch (error) {
    next(error);
  }
};

// ── 4. GET PREDICTIONS (адмін) ────────────────────────────────────────────────
export const getPredictions = async (req, res, next) => {
  try {
    const { page = 0, size = 10, isDinosaur, hasFeedback } = req.query;

    const matchStage = {};
    if (isDinosaur !== undefined) matchStage.isDinosaur = isDinosaur === "true";
    if (hasFeedback !== undefined) {
      matchStage.feedback = hasFeedback === "true" ? { $ne: null } : null;
    }

    const result = await Prediction.aggregate([
      { $match: matchStage },
      {
        $facet: {
          data: [
            { $sort: { createdAt: -1 } },
            { $skip: parseInt(page) * parseInt(size) },
            { $limit: parseInt(size) },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        predictions: result[0].data,
        count: result[0].totalCount[0]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── 5. GET STATS (адмін) ──────────────────────────────────────────────────────
export const getStats = async (req, res, next) => {
  try {
    const stats = await getOrCreateStats();
    const total = stats.totalFeedback;
    const accuracyPercent =
      total > 0
        ? Math.round((stats.correctFeedback / total) * 10000) / 100
        : null;

    res.status(200).json({
      success: true,
      data: {
        ...stats.toObject(),
        accuracyPercent,
        retrainRecommended: stats.pendingRetrain >= 50,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── 6. RETRAIN TRIGGER (адмін) ────────────────────────────────────────────────
export const retrainTrigger = async (req, res, next) => {
  try {
    const response = await fetch(`${ML_API_URL}/retrain_trigger`, {
      method: "POST",
    });

    const mlResult = await response.json();

    if (mlResult.status === "Готово до перенавчання") {
      await PredictionImage.deleteMany({ usedForRetrain: true });
    }

    res.status(200).json({
      success: true,
      data: mlResult,
    });
  } catch (error) {
    next(error);
  }
};
