import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { MongoClient, ObjectId } from "mongodb";
import dns from "node:dns";
import path from "node:path";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

if (!process.env.MONGODB_URI) {
  dotenv.config({
    path: path.join(process.cwd(), "../re-read-client/.env"),
  });
}

const app = express();
const port = Number(process.env.PORT) || 5000;
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000";
const mongoUri = process.env.MONGODB_URI;

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  })
);
app.use(express.json());

let client: MongoClient | null = null;

type TBook = {
  title: string;
  author: string;
  shortDescription: string;
  fullDescription: string;
  price: number;
  genre: string;
  condition: string;
  location: string;
  language: string;
  edition: string;
  imageUrl?: string;
  ownerName?: string;
  ownerEmail?: string;
  status: string;
  createdAt: Date;
};

async function connectDB() {
  if (!mongoUri) {
    throw new Error("Please define MONGODB_URI in .env");
  }

  if (!client) {
    client = new MongoClient(mongoUri);
    await client.connect();
  }

  return client.db("ReRead");
}

app.get("/", (_req: Request, res: Response) => {
  res.send("ReRead server is running");
});

app.get("/api/health", async (_req: Request, res: Response) => {
  try {
    const db = await connectDB();
    await db.command({ ping: 1 });

    res.json({
      success: true,
      message: "ReRead backend connected successfully",
      data: {
        database: "MongoDB connected",
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Backend could not connect to MongoDB",
    });
  }
});

app.get("/api/books", async (_req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const books = await db
      .collection("books")
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    const formattedBooks = books.map((book) => ({
      id: book._id.toString(),
      title: book.title,
      author: book.author,
      shortDescription: book.shortDescription,
      fullDescription: book.fullDescription,
      price: book.price,
      genre: book.genre,
      condition: book.condition,
      location: book.location,
      language: book.language,
      edition: book.edition,
      imageUrl: book.imageUrl,
      ownerName: book.ownerName,
      ownerEmail: book.ownerEmail,
      status: book.status,
      createdAt: book.createdAt,
    }));

    res.json({
      success: true,
      message: "Books fetched successfully",
      data: formattedBooks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch books",
    });
  }
});

app.post("/api/books", async (req: Request, res: Response) => {
  try {
    const data = req.body;

    if (
      !data.title ||
      !data.author ||
      !data.shortDescription ||
      !data.fullDescription ||
      !data.price ||
      !data.genre ||
      !data.condition ||
      !data.location
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required book information",
      });
    }

    const price = Number(data.price);

    if (Number.isNaN(price) || price < 0 || price > 100000) {
      return res.status(400).json({
        success: false,
        message: "Price must be a valid number between 0 and 100000",
      });
    }

    const newBook: TBook = {
      title: data.title,
      author: data.author,
      shortDescription: data.shortDescription,
      fullDescription: data.fullDescription,
      price,
      genre: data.genre,
      condition: data.condition,
      location: data.location,
      language: data.language || "English",
      edition: data.edition || "Paperback",
      imageUrl: data.imageUrl || "",
      ownerName: data.ownerName || "",
      ownerEmail: data.ownerEmail || "",
      status: "Active",
      createdAt: new Date(),
    };

    const db = await connectDB();
    const result = await db.collection("books").insertOne(newBook);

    res.status(201).json({
      success: true,
      message: "Book listing added successfully",
      data: {
        id: result.insertedId,
        ...newBook,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to add book listing",
    });
  }
});

app.delete("/api/books/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book id",
      });
    }

    const db = await connectDB();
    const result = await db.collection("books").deleteOne({
      _id: new ObjectId(id),
    });

    if (!result.deletedCount) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.json({
      success: true,
      message: "Book deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete book",
    });
  }
});

app.listen(port, () => {
  console.log(`ReRead server is running on port ${port}`);
});
