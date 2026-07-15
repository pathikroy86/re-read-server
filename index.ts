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
const clientUrls = [
  process.env.CLIENT_URL || "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:3002",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3002",
];
const mongoUri = getMongoUri();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || clientUrls.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());

let client: MongoClient | null = null;

function getMongoUri() {
  if (!process.env.MONGODB_URI) {
    return "";
  }

  return process.env.MONGODB_URI.replace(
    "@cluster0.exh2zgz.mongodb.net/?appName=Cluster0",
    "@ac-8wcx1qf-shard-00-00.exh2zgz.mongodb.net:27017,ac-8wcx1qf-shard-00-01.exh2zgz.mongodb.net:27017,ac-8wcx1qf-shard-00-02.exh2zgz.mongodb.net:27017/?ssl=true&authSource=admin&replicaSet=atlas-hpoy7r-shard-0&retryWrites=true&w=majority&appName=Cluster0"
  ).replace("mongodb+srv://", "mongodb://");
}

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
  rating?: number;
  reviewCount?: number;
  ownerName?: string;
  ownerEmail?: string;
  status: string;
  createdAt: Date;
};

type TContactMessage = {
  name: string;
  email: string;
  subject: string;
  message: string;
  userEmail: string;
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
      rating: book.rating,
      reviewCount: book.reviewCount,
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
      rating: Number(data.rating) || 0,
      reviewCount: Number(data.reviewCount) || 0,
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

app.get("/api/books/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book id",
      });
    }

    const db = await connectDB();
    const book = await db.collection("books").findOne({
      _id: new ObjectId(id),
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    res.json({
      success: true,
      message: "Book fetched successfully",
      data: {
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
      rating: book.rating,
      reviewCount: book.reviewCount,
      ownerName: book.ownerName,
        ownerEmail: book.ownerEmail,
        status: book.status,
        createdAt: book.createdAt,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch book",
    });
  }
});

app.post("/api/favorites", async (req: Request, res: Response) => {
  try {
    const { bookId, userEmail, userName } = req.body;

    if (!bookId || !userEmail) {
      return res.status(400).json({
        success: false,
        message: "Book id and user email are required",
      });
    }

    if (!ObjectId.isValid(bookId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid book id",
      });
    }

    const db = await connectDB();
    const book = await db.collection("books").findOne({
      _id: new ObjectId(bookId),
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        message: "Book not found",
      });
    }

    const exists = await db.collection("favorites").findOne({
      bookId,
      userEmail,
    });

    if (exists) {
      return res.json({
        success: true,
        message: "Book already saved to favorites",
        data: {
          id: exists._id.toString(),
        },
      });
    }

    const favorite = {
      bookId,
      userEmail,
      userName: userName || "",
      createdAt: new Date(),
    };

    const result = await db.collection("favorites").insertOne(favorite);

    res.status(201).json({
      success: true,
      message: "Book saved to favorites",
      data: {
        id: result.insertedId,
        ...favorite,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to save favorite",
    });
  }
});

app.get("/api/favorites", async (req: Request, res: Response) => {
  try {
    const userEmail = String(req.query.userEmail || "");

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required",
      });
    }

    const db = await connectDB();
    const favorites = await db
      .collection("favorites")
      .find({ userEmail })
      .sort({ createdAt: -1 })
      .toArray();

    const bookIds = favorites
      .filter((favorite) => ObjectId.isValid(favorite.bookId))
      .map((favorite) => new ObjectId(favorite.bookId));

    const books = await db
      .collection("books")
      .find({ _id: { $in: bookIds } })
      .toArray();

    const formattedFavorites = favorites
      .map((favorite) => {
        const book = books.find(
          (item) => item._id.toString() === favorite.bookId
        );

        if (!book) {
          return null;
        }

        return {
          id: favorite._id.toString(),
          bookId: favorite.bookId,
          userEmail: favorite.userEmail,
          createdAt: favorite.createdAt,
          book: {
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
            rating: book.rating,
            reviewCount: book.reviewCount,
            ownerName: book.ownerName,
            ownerEmail: book.ownerEmail,
            status: book.status,
            createdAt: book.createdAt,
          },
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      message: "Favorites fetched successfully",
      data: formattedFavorites,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch favorites",
    });
  }
});

app.post("/api/contact-messages", async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message, userEmail } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, subject, and message",
      });
    }

    const contactMessage: TContactMessage = {
      name,
      email,
      subject,
      message,
      userEmail: userEmail || email,
      status: "Sent",
      createdAt: new Date(),
    };

    const db = await connectDB();
    const result = await db
      .collection("contactMessages")
      .insertOne(contactMessage);

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        id: result.insertedId.toString(),
        ...contactMessage,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
});

app.get("/api/contact-messages", async (req: Request, res: Response) => {
  try {
    const userEmail = String(req.query.userEmail || "");

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required",
      });
    }

    const db = await connectDB();
    const messages = await db
      .collection("contactMessages")
      .find({ userEmail })
      .sort({ createdAt: -1 })
      .toArray();

    const formattedMessages = messages.map((message) => ({
      id: message._id.toString(),
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
      userEmail: message.userEmail,
      status: message.status,
      createdAt: message.createdAt,
    }));

    res.json({
      success: true,
      message: "Messages fetched successfully",
      data: formattedMessages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
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
