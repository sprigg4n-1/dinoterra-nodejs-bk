import mongoose from "mongoose";
import User from "../models/user.model.js";
import UserImage from "../models/userImage.model.js";
import FavoriteDinoV2 from "../models/favoriteDinoV2.model.js";
import DinoV2Image from "../models/dinoV2Image.model.js";

export const getUsers = async (req, res, next) => {
  try {
    const users = await User.find();

    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getPhoto = async (req, res, next) => {
  try {
    const userId = req.params.id;
    const newImage = await UserImage.findOne({ user: userId });

    res.status(200).json({
      success: true,
      message: "Image find succussfully",
      data: {
        image: newImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadPhoto = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = req.body;

    const newImages = await UserImage.create([body], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Image added successfully",
      data: {
        image: newImages[0],
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

    const deletedImage = await UserImage.findByIdAndDelete(imageId, {
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
        image: deletedImage,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const getFavoriteDinosV2 = async (req, res, next) => {
  try {
    const favDinos = await FavoriteDinoV2.find({
      user: req.params.userId,
    }).populate("dino");

    const result = await Promise.all(
      favDinos
        .filter((fav) => fav.dino != null)
        .map(async (fav) => {
          const image = await DinoV2Image.findOne({ dino: fav.dino._id, isMain: true });

          return {
            _id: fav._id,
            user: fav.user,
            dino: fav.dino,
            image,
          };
        })
    );

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const addFavoriteDinoV2 = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = req.body;

    const newFavDinos = await FavoriteDinoV2.create([body], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Favorite DinoV2 added successfully",
      data: {
        favDino: newFavDinos[0],
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const deleteFavoriteDinoV2 = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.params.userId;
    const dinoId = req.params.dinoId;

    const deletedFavoriteDino = await FavoriteDinoV2.findOneAndDelete(
      { user: userId, dino: dinoId },
      { session }
    );

    if (!deletedFavoriteDino) {
      const error = new Error("Favorite DinoV2 not found");
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Favorite DinoV2 deleted successfully",
      data: {
        favDino: deletedFavoriteDino,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const isFavoriteDinoV2 = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const dinoId = req.params.dinoId;

    const exists = await FavoriteDinoV2.exists({ user: userId, dino: dinoId });

    res.status(200).json({
      success: true,
      data: {
        isFavorite: !!exists,
      },
    });
  } catch (error) {
    next(error);
  }
};
