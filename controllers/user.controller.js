import mongoose from "mongoose";
import User from "../models/user.model.js";
import UserImage from "../models/userImage.model.js";
import FavoriteDino from "../models/favoriteDino.js";
import DinoImage from "../models/dinoImage.model.js";

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

export const getFavoriteDinos = async (req, res, next) => {
  try {
    const favDinos = await FavoriteDino.find({
      user: req.params.userId,
    }).populate("dino");

    const result = await Promise.all(
      favDinos.map(async (fav) => {
        const image = await DinoImage.findOne({ dino: fav.dino._id });

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

export const addFavoriteDino = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const body = req.body;

    const newFavDinos = await FavoriteDino.create([body], { session });

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Favorite Dino added successfully",
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

export const deleteFavoriteDino = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = req.params.userId;
    const dinoId = req.params.dinoId;

    const deletedFavoriteDino = await FavoriteDino.findOneAndDelete(
      { user: userId, dino: dinoId },
      {
        session,
      }
    );

    if (!deletedFavoriteDino) {
      const error = new Error("Favorite Dino not found");
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Favorite Dino deleted successfully",
      data: {
        image: deletedFavoriteDino,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

export const isFavoriteDino = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const dinoId = req.params.dinoId;

    const exists = await FavoriteDino.exists({ user: userId, dino: dinoId });

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
