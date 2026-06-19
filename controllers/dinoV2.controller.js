import mongoose from "mongoose";

import DinoV2 from "../models/dinoV2.model.js";
import DinoV2Image from "../models/dinoV2Image.model.js";
import DinoV2ArticleImage from "../models/dinoV2ArticleImage.model.js";
import FoundLocationV2 from "../models/foundLocationV2.model.js";

// GET /api/v2/dinos
export const getDinosV2 = async (req, res, next) => {
  try {
    const {
      page = 0,
      size = 10,
      name,
      latinName,
      type,
      diet,
      period,
    } = req.query;

    const match = {};

    if (name?.trim()) {
      const regex = { $regex: name.trim(), $options: "i" };
      match.$or = [{ "name.uk": regex }, { "name.en": regex }];
    }
    if (latinName?.trim())
      match.latinName = { $regex: latinName.trim(), $options: "i" };
    if (type?.trim()) match.typeOfDino = { $regex: type.trim(), $options: "i" };
    if (diet?.trim()) match.diet = { $regex: diet.trim(), $options: "i" };
    if (period?.trim()) match.period = { $regex: period.trim(), $options: "i" };

    const [result] = await DinoV2.aggregate([
      { $match: match },
      {
        $facet: {
          data: [
            { $skip: parseInt(page) * parseInt(size) },
            { $limit: parseInt(size) },
          ],
          totalCount: [{ $count: "count" }],
        },
      },
    ]);

    const dinos = result.data;
    const totalCount = result.totalCount[0]?.count || 0;

    const dinosWithImages = await Promise.all(
      dinos.map(async (dino) => {
        const image =
          (await DinoV2Image.findOne({ dino: dino._id, isMain: true })) ||
          (await DinoV2Image.findOne({ dino: dino._id }));
        return { ...dino, mainImage: image?.file || null };
      }),
    );

    res.status(200).json({
      success: true,
      data: { dinos: dinosWithImages, count: totalCount },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v2/dinos/random
export const getFiveRandomDinosV2 = async (req, res, next) => {
  try {
    const dinos = await DinoV2.aggregate([{ $sample: { size: 5 } }]);

    const dinosWithImages = await Promise.all(
      dinos.map(async (dino) => {
        const image =
          (await DinoV2Image.findOne({ dino: dino._id, isMain: true })) ||
          (await DinoV2Image.findOne({ dino: dino._id }));
        return { ...dino, mainImage: image?.file || null };
      }),
    );

    res.status(200).json({ success: true, data: dinosWithImages });
  } catch (error) {
    next(error);
  }
};

// GET /api/v2/dinos/:id/similar
export const getSimilarDinosV2 = async (req, res, next) => {
  try {
    const { id } = req.params;

    const baseDino = await DinoV2.findById(id);
    if (!baseDino) {
      const error = new Error("Dino not found");
      error.statusCode = 404;
      throw error;
    }

    const similarDinos = await DinoV2.find({
      _id: { $ne: id },
      typeOfDino: baseDino.typeOfDino,
    }).limit(5);

    const dinosWithImages = await Promise.all(
      similarDinos.map(async (dino) => {
        const image =
          (await DinoV2Image.findOne({ dino: dino._id, isMain: true })) ||
          (await DinoV2Image.findOne({ dino: dino._id }));
        return { ...dino.toObject(), mainImage: image?.file || null };
      }),
    );

    res.status(200).json({ success: true, data: dinosWithImages });
  } catch (error) {
    next(error);
  }
};

// GET /api/v2/dinos/:id
export const getDinoV2 = async (req, res, next) => {
  try {
    const dino = await DinoV2.findById(req.params.id);

    if (!dino) {
      const error = new Error("Dino not found");
      error.statusCode = 404;
      throw error;
    }

    const [images, articleImages, foundLocations] = await Promise.all([
      DinoV2Image.find({ dino: dino._id }),
      DinoV2ArticleImage.find({ dino: dino._id }),
      FoundLocationV2.find({ dino: dino._id }),
    ]);

    res.status(200).json({
      success: true,
      data: { dino, images, articleImages, foundLocations },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v2/dinos
export const createDinoV2 = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      name,
      latinName,
      typeOfDino,
      period,
      periodDate,
      diet,
      length,
      weight,
      article,
    } = req.body;

    const existing = await DinoV2.findOne({ latinName });
    if (existing) {
      const error = new Error("Dino with this latin name already exists");
      error.statusCode = 409;
      throw error;
    }

    const [newDino] = await DinoV2.create(
      [
        {
          name,
          latinName,
          typeOfDino,
          period,
          periodDate,
          diet,
          length,
          weight,
          article,
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "DinoV2 created successfully",
      data: { dino: newDino },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// PUT /api/v2/dinos/:id
export const updateDinoV2 = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const updated = await DinoV2.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
      session,
    });

    if (!updated) {
      const error = new Error("Dino not found");
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "DinoV2 updated successfully",
      data: { dino: updated },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// DELETE /api/v2/dinos/:id
export const deleteDinoV2 = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deleted = await DinoV2.findByIdAndDelete(req.params.id, { session });

    if (!deleted) {
      const error = new Error("Dino not found");
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "DinoV2 deleted successfully",
      data: { dino: deleted },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// POST /api/v2/dinos/upload-image  — cover/gallery image
export const uploadCoverImageV2 = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { dino, file, isMain } = req.body;

    if (isMain) {
      await DinoV2Image.updateMany({ dino }, { isMain: false }, { session });
    }

    const [image] = await DinoV2Image.create(
      [{ dino, file, isMain: isMain || false }],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Cover image uploaded",
      data: { image },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// DELETE /api/v2/dinos/images/:id  — cover/gallery image
export const deleteCoverImageV2 = async (req, res, next) => {
  try {
    const deleted = await DinoV2Image.findByIdAndDelete(req.params.id);

    if (!deleted) {
      const error = new Error("Image not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Cover image deleted",
      data: { image: deleted },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v2/dinos/upload-article-image  — image for use inside TipTap article
export const uploadArticleImageV2 = async (req, res, next) => {
  try {
    const { dino, file, caption } = req.body;

    const image = await DinoV2ArticleImage.create({ dino, file, caption });

    res.status(201).json({
      success: true,
      message: "Article image uploaded",
      data: { image },
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/v2/dinos/article-images/:id
export const deleteArticleImageV2 = async (req, res, next) => {
  try {
    const deleted = await DinoV2ArticleImage.findByIdAndDelete(req.params.id);

    if (!deleted) {
      const error = new Error("Article image not found");
      error.statusCode = 404;
      throw error;
    }

    res.status(200).json({
      success: true,
      message: "Article image deleted",
      data: { image: deleted },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/v2/dinos/found-locations?place=&period=
export const getFoundLocationsV2 = async (req, res, next) => {
  try {
    const { place, period } = req.query;

    let foundLocations = await FoundLocationV2.find({}).populate("dino");

    foundLocations = foundLocations.filter((loc) => loc.dino != null);

    if (place?.trim()) {
      const regex = new RegExp(place.trim(), "i");
      foundLocations = foundLocations.filter(
        (loc) => regex.test(loc.place.uk) || regex.test(loc.place.en)
      );
    }

    if (period?.trim()) {
      const regex = new RegExp(period.trim(), "i");
      foundLocations = foundLocations.filter((loc) => regex.test(loc.dino.period));
    }

    const data = foundLocations.map((loc) => ({
      _id: loc._id,
      place: loc.place,
      latitude: loc.latitude,
      longitude: loc.longitude,
      dino: loc.dino._id,
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// POST /api/v2/dinos/found-location
export const addFoundLocationV2 = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { dino, place, latitude, longitude } = req.body;

    const [newLocation] = await FoundLocationV2.create(
      [{ dino, place, latitude, longitude }],
      { session },
    );

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({
      success: true,
      message: "Found location added successfully",
      data: { foundLocation: newLocation },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

// DELETE /api/v2/dinos/found-locations/:id
export const deleteFoundLocationV2 = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const deleted = await FoundLocationV2.findByIdAndDelete(req.params.id, {
      session,
    });

    if (!deleted) {
      const error = new Error("Found location not found");
      error.statusCode = 404;
      throw error;
    }

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Found location deleted successfully",
      data: { foundLocation: deleted },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};
