import mongoose from "mongoose";
import FormData from "form-data";
import fetch from "node-fetch";

import Prediction from "../models/prediction.model.js";
import PredictionImage from "../models/predictionImage.model.js";
import ModelStats from "../models/modelStats.model.js";
import RetrainHistory from "../models/retrainHistory.model.js";

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
    const mlResult = await sendBase64ToML("/predict", base64, mimeType);

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

    await session.commitTransaction();
    session.endSession();

    await ModelStats.findOneAndUpdate(
      {},
      { $inc: { totalPredictions: 1 } },
      { upsert: true },
    );

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
    const {
      isCorrect,
      errorType,
      correctRank,
      correctClass,
      givenBy = "USER",
    } = req.body;

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
      errorType: errorType || null,
      correctRank: correctRank || null,
      correctClass: correctClass || null,
      givenBy,
      givenAt: new Date(),
    };

    await prediction.save({ session });

    // ── Позначаємо фото для перенавчання в MongoDB ────────────────────────────
    const needsRetrain =
      (errorType === "WRONG_SPECIES" && correctClass) ||
      errorType === "FALSE_NEGATIVE" ||
      errorType === "FALSE_POSITIVE" ||
      (errorType === "NEW_SPECIES" && correctClass);

    if (!isCorrect && needsRetrain) {
      await PredictionImage.findOneAndUpdate(
        { prediction: prediction._id },
        {
          usedForRetrain: true,
          correctClass: correctClass || null,
          errorType,
        },
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    // ── Оновлюємо статистику ПОЗА транзакцією ────────────────────────────────
    const statsInc = { totalFeedback: 1 };

    if (isCorrect) {
      statsInc.correctFeedback = 1;
      if (prediction.isDinosaur) {
        if (correctRank === 1) statsInc["rankStats.top1"] = 1;
        if (correctRank === 2) statsInc["rankStats.top2"] = 1;
        if (correctRank === 3) statsInc["rankStats.top3"] = 1;
      } else {
        statsInc["rankStats.correctNonDino"] = 1;
      }
    } else if (errorType === "WRONG_SPECIES") {
      statsInc.wrongFeedback = 1;
      statsInc["errorStats.wrongSpecies"] = 1;
      if (correctClass) statsInc.pendingRetrain = 1;
      else statsInc.unknownFeedback = 1;
    } else if (errorType === "FALSE_NEGATIVE") {
      statsInc.wrongFeedback = 1;
      statsInc["errorStats.falseNegative"] = 1;
      statsInc.pendingRetrain = 1;
    } else if (errorType === "FALSE_POSITIVE") {
      statsInc.wrongFeedback = 1;
      statsInc["errorStats.falsePositive"] = 1;
      statsInc.pendingRetrain = 1;
    } else if (errorType === "NEW_SPECIES") {
      statsInc.wrongFeedback = 1;
      statsInc["errorStats.newSpecies"] = 1;
      if (correctClass) statsInc.pendingRetrain = 1;
      else statsInc.unknownFeedback = 1;
    } else {
      statsInc.wrongFeedback = 1;
      statsInc.unknownFeedback = 1;
    }

    await ModelStats.findOneAndUpdate({}, { $inc: statsInc }, { upsert: true });

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

// ── 4. GET RETRAIN IMAGES — для retrain.py ────────────────────────────────────
export const getRetrainImages = async (req, res, next) => {
  try {
    const images = await PredictionImage.find({ usedForRetrain: true });

    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    next(error);
  }
};

// ── 5. DELETE RETRAIN IMAGES — після перенавчання ─────────────────────────────
export const deleteRetrainImages = async (req, res, next) => {
  try {
    const result = await PredictionImage.deleteMany({ usedForRetrain: true });

    res.status(200).json({
      success: true,
      message: `Видалено ${result.deletedCount} фото після перенавчання`,
    });
  } catch (error) {
    next(error);
  }
};

// ── 6. GET PREDICTIONS (адмін) ────────────────────────────────────────────────
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

// ── 7. GET STATS (адмін) ──────────────────────────────────────────────────────
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

// ── 9. START RETRAIN — створюємо запис в історії ─────────────────────────────
export const retrainTrigger = async (req, res, next) => {
  try {
    // Створюємо запис в історії
    const retrainRecord = await RetrainHistory.create({
      startedAt: new Date(),
      status: "RUNNING",
    });

    const response = await fetch(`${ML_API_URL}/retrain_trigger`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ retrainId: retrainRecord._id.toString() }),
    });

    const mlResult = await response.json();

    res.status(200).json({
      success: true,
      data: {
        ...mlResult,
        retrainId: retrainRecord._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── 10. FINISH RETRAIN — retrain.py викликає коли закінчив ───────────────────
export const retrainDone = async (req, res, next) => {
  try {
    const {
      retrainId,
      imagesUsed,
      newClasses = [],
      stage1,
      stage2,
      status = "DONE",
    } = req.body;

    if (!retrainId) {
      const error = new Error("retrainId is required");
      error.status = 400;
      throw error;
    }

    const retrainRecord = await RetrainHistory.findByIdAndUpdate(
      retrainId,
      {
        finishedAt: new Date(),
        imagesUsed: imagesUsed || 0,
        newClasses,
        status,
        stage1: stage1
          ? {
              valAccuracy: stage1.val_accuracy,
              valLoss: stage1.val_loss,
              epochs: stage1.epochs,
              history: {
                accuracy: stage1.history_accuracy || [],
                valAccuracy: stage1.history_val_accuracy || [],
                loss: stage1.history_loss || [],
                valLoss: stage1.history_val_loss || [],
              },
            }
          : null,
        stage2: stage2
          ? {
              valAccuracy: stage2.val_accuracy,
              valLoss: stage2.val_loss,
              epochs: stage2.epochs,
              history: {
                accuracy: stage2.history_accuracy || [],
                valAccuracy: stage2.history_val_accuracy || [],
                loss: stage2.history_loss || [],
                valLoss: stage2.history_val_loss || [],
              },
            }
          : null,
      },
      { new: true },
    );

    // Оновлюємо lastRetrain в ModelStats
    await ModelStats.findOneAndUpdate(
      {},
      {
        lastRetrain: new Date(),
        pendingRetrain: 0,
        "lastRetrainResults.stage1.valAccuracy": stage1?.val_accuracy || null,
        "lastRetrainResults.stage1.valLoss": stage1?.val_loss || null,
        "lastRetrainResults.stage2Dino.valAccuracy":
          stage2?.val_accuracy || null,
        "lastRetrainResults.stage2Dino.valLoss": stage2?.val_loss || null,
      },
      { upsert: true },
    );

    res.status(200).json({
      success: true,
      data: retrainRecord,
    });
  } catch (error) {
    next(error);
  }
};

// ── 11. GET RETRAIN HISTORY (адмін) ──────────────────────────────────────────
export const getRetrainHistory = async (req, res, next) => {
  try {
    const { page = 0, size = 10 } = req.query;

    const result = await RetrainHistory.aggregate([
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
        history: result[0].data,
        count: result[0].totalCount[0]?.count || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ── 12. GET RETRAIN HISTORY BY ID (адмін) ────────────────────────────────────
export const getRetrainHistoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const record = await RetrainHistory.findById(id);

    if (!record) {
      const error = new Error("Retrain record not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};
