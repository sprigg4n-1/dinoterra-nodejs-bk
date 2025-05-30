import User from "../models/user.model.js";
import UserImage from "../models/userImage.model.js";

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

export const uploadPhoto = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const body = req.body;

    const newImages = await UserImage.create(body);

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
        dino: deletedImage,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
