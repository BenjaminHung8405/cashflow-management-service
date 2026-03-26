import cors from "cors"
import express from "express"
import helmet from "helmet"

// global error middleware
import { errorHandler } from "./core/middlewares/error.middleware.js"

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// health check route
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() })
})

// TODO: Mount feature routes
// import authRoutes from "./features/auth/auth.routes.js"
// app.use("/api/auth", authRoutes)

app.use(errorHandler)

export default app