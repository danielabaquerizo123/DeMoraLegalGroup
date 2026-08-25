import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { errorMiddleware, notFoundMiddleware } from "./middlewares/error.middleware";
import { apiRoutes } from "./routes";

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3000;
const host = process.env.HOST || "0.0.0.0";
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? allowedOrigins : true,
    credentials: true,
  }),
);
// 4 mb: permite data URLs Base64 de portada (tope del validador: 3.000.000 caracteres)
// con margen para el resto del JSON, sin dejar el cuerpo sin limite.
app.use(express.json({ limit: "4mb" }));

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/api", apiRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

app.listen(port, host, () => {
  console.log(`Backend running on ${host}:${port}`);
});
