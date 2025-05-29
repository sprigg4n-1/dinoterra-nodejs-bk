import aj from "../config/arcjet.js";

const arcjetMiddlewares = async (req, res, next) => {
  try {
    const ua = req.headers["user-agent"] || "";

    const decision = await aj.protect(req, { requested: 1 });

    if (decision.isDenied() && !/Postman/i.test(ua)) {
      if (decision.reason.isRateLimit())
        return res.status(429).json({ error: "Rate limit exceeded" });

      if (decision.reason.isBot())
        return res.status(403).json({ error: "Bot detected" });

      return res.status(403).json({ error: "Access denied" });
    }

    next();
  } catch (error) {
    console.log(`Arcjet Middleware Error: ${error}`);
    next(error);
  }
};

export default arcjetMiddlewares;
