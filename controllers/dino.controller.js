import mongoose from "mongoose";

import Dino from "../models/dino.model.js";
import DinoImage from "../models/dinoImage.model.js";
import FoundLocation from "../models/foundLocation.model.js";

export const getDinos = async (req, res, next) => {
  try {
    const dinos = await Dino.find();
    const images = await DinoImage.find();

    const imageMap = {};
    images.forEach((img) => {
      if (!imageMap[img.dino]) {
        imageMap[img.dino] = img.file;
      }
    });

    const dinosWithImages = dinos.map((dino) => ({
      ...dino.toObject(),
      image: imageMap[dino._id] || "",
    }));

    res.status(200).json({ success: true, data: dinosWithImages });
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

    const images = await DinoImage.find({
      dino: { $in: similarDinos.map((d) => d._id) },
    });

    const imageMap = {};
    images.forEach((img) => {
      if (!imageMap[img.dino]) {
        imageMap[img.dino] = img.file;
      }
    });

    const result = similarDinos.map((dino) => ({
      ...dino.toObject(),
      image: imageMap[dino._id] || "",
    }));

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getFiveRandomDinos = async (req, res, next) => {
  try {
    const dinos = await Dino.aggregate([{ $sample: { size: 5 } }]);

    const dinoIds = dinos.map((d) => d._id);

    const images = await DinoImage.find({
      dino: { $in: dinoIds },
    });

    const imageMap = {};
    images.forEach((img) => {
      if (!imageMap[img.dino]) {
        imageMap[img.dino] = img.file;
      }
    });

    const dinosWithImages = dinos.map((dino) => ({
      ...dino,
      image: imageMap[dino._id] || "",
    }));

    res.status(200).json({ success: true, data: dinosWithImages });
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
    const dinoId = req.params.id;
    const dino = await Dino.findById(dinoId);

    if (!dino) {
      const error = new Error("Dino not found");
      error.status = 404;
      throw error;
    }

    const [images, foundLocations] = await Promise.all([
      DinoImage.find({ dino: dinoId }),
      FoundLocation.find({ dino: dinoId }),
    ]);

    res.status(200).json({
      success: true,
      data: {
        dino,
        images,
        foundLocations,
      },
    });
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

export const uploadPhoto = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = req.body;

    const newImages = await DinoImage.create(body);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Image added successfully",
      data: {
        Image: newImages[0],
      },
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
    const imageId = req.params.id;

    const deletedImage = await DinoImage.findByIdAndDelete(imageId, {
      session,
    });

    if (!deletedImage) {
      const error = new Error("Image not found");
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      data: {
        dino: deletedImage,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getFoundLocations = async (req, res, next) => {
  try {
    const foundLocations = await FoundLocation.find();

    res.status(200).json({ success: true, data: foundLocations });
  } catch (error) {
    next(error);
  }
};

export const addFoundLocation = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = req.body;

    const newFoundLocations = await FoundLocation.create(body);

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "FoundLocation added successfully",
      data: {
        Image: newFoundLocations[0],
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const deleteFoundLocation = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const foundLocationId = req.params.id;

    const deletedFoundLocation = await FoundLocation.findByIdAndDelete(
      foundLocationId,
      {
        session,
      }
    );

    if (!deletedFoundLocation) {
      const error = new Error("Found location not found");
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "FoundLocation deleted successfully",
      data: {
        dino: deletedFoundLocation,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
