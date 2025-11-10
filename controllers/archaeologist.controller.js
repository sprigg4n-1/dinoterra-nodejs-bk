import mongoose from "mongoose";
import Archaeologist from "../models/archaeologist.model.js";
import ArchaeologistImage from "../models/archaeologistImage.model.js";

export const getArchaeologists = async (req, res, next) => {
  try {
    const { page = 0, size = 10, name, specialization } = req.query;

    const matchStage = {
      ...(name && {
        $or: [
          { firstName: { $regex: name, $options: "i" } },
          { lastName: { $regex: name, $options: "i" } },
        ],
      }),
      ...(specialization && {
        specialization: { $regex: specialization, $options: "i" },
      }),
    };

    const aggregation = [
      { $match: matchStage },
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

    const result = await Archaeologist.aggregate(aggregation);
    const archaeologists = result[0].data;
    const totalCount = result[0].totalCount[0]?.count || 0;

    const withImages = await Promise.all(
      archaeologists.map(async (arch) => {
        const image = await ArchaeologistImage.findOne({
          archaeologist: arch._id,
        });
        return { ...arch, image: image?.file || "" };
      })
    );

    res.status(200).json({
      success: true,
      data: { archaeologists: withImages, count: totalCount },
    });
  } catch (error) {
    next(error);
  }
};

export const getArchaeologist = async (req, res, next) => {
  try {
    const id = req.params.id;
    const archaeologist = await Archaeologist.findById(id);
    if (!archaeologist) {
      const err = new Error("Archaeologist not found");
      err.status = 404;
      throw err;
    }

    const images = await ArchaeologistImage.find({ archaeologist: id });

    res.status(200).json({
      success: true,
      data: { archaeologist, images },
    });
  } catch (error) {
    next(error);
  }
};

export const createArchaeologist = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = req.body;

    const newArch = await Archaeologist.create([body], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Archaeologist created successfully",
      data: { archaeologist: newArch[0] },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const changeArchaeologist = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const id = req.params.id;
    const updated = await Archaeologist.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
      session,
    });

    if (!updated) {
      const err = new Error("Archaeologist not found");
      err.status = 404;
      throw err;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Archaeologist updated successfully",
      data: { archaeologist: updated },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const deleteArchaeologist = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const id = req.params.id;
    const deleted = await Archaeologist.findByIdAndDelete(id, { session });

    if (!deleted) {
      const err = new Error("Archaeologist not found");
      err.status = 404;
      throw err;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Archaeologist deleted successfully",
      data: { archaeologist: deleted },
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
    const newImg = await ArchaeologistImage.create([req.body], { session });
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
    const deleted = await ArchaeologistImage.findByIdAndDelete(id, { session });

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
