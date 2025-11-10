import mongoose from "mongoose";
import Expedition from "../models/expedition.model.js";
import ExpeditionImage from "../models/expeditionImage.model.js";

export const getExpeditions = async (req, res, next) => {
  try {
    const { page = 0, size = 10, name, location } = req.query;

    const matchStage = {
      ...(name && { name: { $regex: name, $options: "i" } }),
    };

    const aggregation = [
      {
        $lookup: {
          from: "foundlocations",
          localField: "location",
          foreignField: "_id",
          as: "foundLocation",
        },
      },
      {
        $match: location
          ? { "foundLocation.place": { $regex: location, $options: "i" } }
          : matchStage,
      },
      {
        $facet: {
          data: [
            { $skip: parseInt(page) * parseInt(size) },
            { $limit: parseInt(size) },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ];

    const result = await Expedition.aggregate(aggregation);
    const expeditions = result[0].data;
    const totalCount = result[0].totalCount[0]?.count || 0;

    const withImages = await Promise.all(
      expeditions.map(async (exp) => {
        const image = await ExpeditionImage.findOne({ expedition: exp._id });
        return { ...exp, image: image?.file || "" };
      })
    );

    res.status(200).json({
      success: true,
      data: { expeditions: withImages, count: totalCount },
    });
  } catch (error) {
    next(error);
  }
};

export const getExpedition = async (req, res, next) => {
  try {
    const id = req.params.id;
    const expedition = await Expedition.findById(id)
      .populate("archaeologists")
      .populate("discoveredDinos")
      .populate("location");

    if (!expedition) {
      const err = new Error("Expedition not found");
      err.status = 404;
      throw err;
    }

    const images = await ExpeditionImage.find({ expedition: id });

    res.status(200).json({
      success: true,
      data: { expedition, images },
    });
  } catch (error) {
    next(error);
  }
};

export const createExpedition = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const newExpedition = await Expedition.create([req.body], { session });
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Expedition created successfully",
      data: { expedition: newExpedition[0] },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const changeExpedition = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const id = req.params.id;
    const updated = await Expedition.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      session,
    });

    if (!updated) {
      const err = new Error("Expedition not found");
      err.status = 404;
      throw err;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Expedition updated successfully",
      data: { expedition: updated },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const deleteExpedition = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const id = req.params.id;
    const deleted = await Expedition.findByIdAndDelete(id, { session });

    if (!deleted) {
      const err = new Error("Expedition not found");
      err.status = 404;
      throw err;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Expedition deleted successfully",
      data: { expedition: deleted },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const uploadPhoto = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const newImg = await ExpeditionImage.create([req.body], { session });
    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Photo uploaded successfully",
      data: { image: newImg[0] },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const deletePhoto = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const id = req.params.id;
    const deleted = await ExpeditionImage.findByIdAndDelete(id, { session });

    if (!deleted) {
      const err = new Error("Image not found");
      err.status = 404;
      throw err;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Photo deleted successfully",
      data: { image: deleted },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
