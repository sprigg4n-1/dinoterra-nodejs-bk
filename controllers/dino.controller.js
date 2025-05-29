import mongoose from "mongoose";

import Dino from "../models/dino.model.js";

export const getDinos = async (req, res, next) => {
  try {
    const dinos = await Dino.find();

    res.status(200).json({ success: true, data: dinos });
  } catch (error) {
    next(error);
  }
};

export const getSimilarDinos = async (req, res, next) => {
  try {
    const { id } = req.params;

    const baseDino = await Dino.findById(id);

    if (!baseDino) {
      const error = new Error("Dino not found");
      error.status = 404;
      throw error;
    }

    const similarDinos = await Dino.find({
      _id: { $ne: id },
      typeOfDino: baseDino.typeOfDino,
      dinoDiet: baseDino.dinoDiet,
    }).limit(5);

    res.status(200).json({ success: true, data: similarDinos });
  } catch (error) {
    next(error);
  }
};

export const getFiveRandomDinos = async (req, res, next) => {
  try {
    const dinos = await Dino.aggregate([{ $sample: { size: 5 } }]);

    res.status(200).json({ success: true, data: dinos });
  } catch (error) {
    next(error);
  }
};

export const getRecommendDinos = async (req, res, next) => {
  try {
  } catch (error) {
    next(error);
  }
};

export const getDino = async (req, res, next) => {
  try {
    const dino = await Dino.findById(req.params.id);

    if (!dino) {
      const error = new Error("Dino not found");
      error.status = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: dino });
  } catch (error) {
    next(error);
  }
};

export const createDino = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      latinName,
      description,
      typeOfDino,
      length,
      weight,
      period,
      periodDate,
      periodDescription,
      diet,
      dietDescription,
    } = req.body;

    const existingDino = await Dino.findOne({ latinName });

    if (existingDino) {
      const error = new Error("Dino with this name already exists");
      error.status = 409;
      throw error;
    }

    const newDinos = await Dino.create(
      [
        {
          name,
          latinName,
          description,
          typeOfDino,
          length,
          weight,
          period,
          periodDate,
          periodDescription,
          diet,
          dietDescription,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Dino created successfully",
      data: {
        dino: newDinos[0],
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const changeDino = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const dinoId = req.params.id;
    const updateData = req.body;

    const updatedDino = await Dino.findByIdAndUpdate(dinoId, updateData, {
      new: true,
      runValidators: true,
      session,
    });

    if (!updatedDino) {
      const error = new Error("Dino not found");
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Dino changed successfully",
      data: {
        dino: updatedDino,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const deleteDino = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const dinoId = req.params.id;

    const deletedDino = await Dino.findByIdAndDelete(dinoId, { session });

    if (!deletedDino) {
      const error = new Error("Dino not found");
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Dino deleted successfully",
      data: {
        dino: deletedDino,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
