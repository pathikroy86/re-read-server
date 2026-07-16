import cors from "cors";
import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { jwtVerify } from "jose-cjs";
import { MongoClient, ObjectId } from "mongodb";
import dns from "node:dns";
import path from "node:path";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

dotenv.config();

if (!process.env.MONGODB_URI || !process.env.BETTER_AUTH_SECRET) {
  dotenv.config({
    path: path.join(process.cwd(), "../re-read-client/.env"),
  });
}

const app = express();
const port = Number(process.env.PORT);
const clientUrls = (process.env.CLIENT_URLS || process.env.CLIENT_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);
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
const jwtSecret = process.env.JWT_SECRET || process.env.BETTER_AUTH_SECRET || "";

type TAuthUser = {
  name: string;
  email: string;
};

type TAuthRequest = Request & {
  user?: TAuthUser;
};

function getMongoUri() {
  return process.env.MONGODB_DIRECT_URI || process.env.MONGODB_URI || "";
}

function getMongoDbName() {
  if (!process.env.MONGODB_DB_NAME) {
    throw new Error("Please define MONGODB_DB_NAME in .env");
  }

  return process.env.MONGODB_DB_NAME;
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

type TBlog = {
  title: string;
  bookTitle: string;
  category: string;
  coverImage?: string;
  excerpt: string;
  content: string;
  authorName: string;
  authorEmail: string;
  readTime: string;
  status: string;
  createdAt: Date;
};

type TBlogComment = {
  blogId: string;
  comment: string;
  userName: string;
  userEmail: string;
  createdAt: Date;
};

type TCartItem = {
  bookId: string;
  userEmail: string;
  userName: string;
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

  return client.db(getMongoDbName());
}

function getJwtSecret() {
  if (!jwtSecret) {
    throw new Error("Please define JWT_SECRET or BETTER_AUTH_SECRET in .env");
  }

  return new TextEncoder().encode(jwtSecret);
}

async function verifyJwt(req: TAuthRequest, res: Response, next: () => void) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized request. JWT token is required.",
      });
    }

    const token = authHeader.split(" ")[1];
    const { payload } = await jwtVerify(token, getJwtSecret());

    if (!payload.email || !payload.name) {
      return res.status(401).json({
        success: false,
        message: "Invalid JWT payload",
      });
    }

    req.user = {
      name: String(payload.name),
      email: String(payload.email),
    };

    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      success: false,
      message: "Invalid or expired JWT token",
    });
  }
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

app.post("/api/books", verifyJwt, async (req: TAuthRequest, res: Response) => {
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
      ownerName: req.user?.name || "",
      ownerEmail: req.user?.email || "",
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

app.post(
  "/api/favorites",
  verifyJwt,
  async (req: TAuthRequest, res: Response) => {
  try {
    const { bookId } = req.body;
    const userEmail = req.user?.email || "";
    const userName = req.user?.name || "";

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
      userName,
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

app.get(
  "/api/favorites",
  verifyJwt,
  async (req: TAuthRequest, res: Response) => {
  try {
    const userEmail = req.user?.email || "";

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

app.post("/api/cart", verifyJwt, async (req: TAuthRequest, res: Response) => {
  try {
    const { bookId } = req.body;
    const userEmail = req.user?.email || "";
    const userName = req.user?.name || "";

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

    const exists = await db.collection("cartItems").findOne({
      bookId,
      userEmail,
    });

    if (exists) {
      return res.json({
        success: true,
        message: "Book already added to cart",
        data: {
          id: exists._id.toString(),
        },
      });
    }

    const cartItem: TCartItem = {
      bookId,
      userEmail,
      userName,
      createdAt: new Date(),
    };

    const result = await db.collection("cartItems").insertOne(cartItem);

    res.status(201).json({
      success: true,
      message: "Book added to cart",
      data: {
        id: result.insertedId.toString(),
        ...cartItem,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to add book to cart",
    });
  }
});

app.get("/api/cart", verifyJwt, async (req: TAuthRequest, res: Response) => {
  try {
    const userEmail = req.user?.email || "";

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        message: "User email is required",
      });
    }

    const db = await connectDB();
    const cartItems = await db
      .collection("cartItems")
      .find({ userEmail })
      .sort({ createdAt: -1 })
      .toArray();

    const bookIds = cartItems
      .filter((item) => ObjectId.isValid(item.bookId))
      .map((item) => new ObjectId(item.bookId));

    const books = await db
      .collection("books")
      .find({ _id: { $in: bookIds } })
      .toArray();

    const formattedCartItems = cartItems
      .map((item) => {
        const book = books.find((book) => book._id.toString() === item.bookId);

        if (!book) {
          return null;
        }

        return {
          id: item._id.toString(),
          bookId: item.bookId,
          userEmail: item.userEmail,
          createdAt: item.createdAt,
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
      message: "Cart fetched successfully",
      data: formattedCartItems,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch cart",
    });
  }
});

app.delete(
  "/api/cart/:id",
  verifyJwt,
  async (req: TAuthRequest, res: Response) => {
    try {
      const id = String(req.params.id);

      if (!ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: "Invalid cart item id",
        });
      }

      const db = await connectDB();
      const result = await db.collection("cartItems").deleteOne({
        _id: new ObjectId(id),
        userEmail: req.user?.email,
      });

      if (!result.deletedCount) {
        return res.status(404).json({
          success: false,
          message: "Cart item not found",
        });
      }

      res.json({
        success: true,
        message: "Book removed from cart",
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Failed to remove cart item",
      });
    }
  }
);

app.post(
  "/api/contact-messages",
  verifyJwt,
  async (req: TAuthRequest, res: Response) => {
  try {
    const { subject, message } = req.body;
    const name = req.user?.name || "";
    const email = req.user?.email || "";
    const userEmail = req.user?.email || "";

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
      userEmail,
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

app.get(
  "/api/contact-messages",
  verifyJwt,
  async (req: TAuthRequest, res: Response) => {
  try {
    const userEmail = req.user?.email || "";

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

app.get("/api/blogs", async (_req: Request, res: Response) => {
  try {
    const db = await connectDB();
    const blogs = await db
      .collection("blogs")
      .find({ status: "Published" })
      .sort({ createdAt: -1 })
      .toArray();

    const blogIds = blogs.map((blog) => blog._id.toString());
    const comments = await db
      .collection("blogComments")
      .find({ blogId: { $in: blogIds } })
      .toArray();

    const formattedBlogs = blogs.map((blog) => ({
      id: blog._id.toString(),
      title: blog.title,
      bookTitle: blog.bookTitle,
      category: blog.category,
      coverImage: blog.coverImage,
      excerpt: blog.excerpt,
      content: blog.content,
      authorName: blog.authorName,
      authorEmail: blog.authorEmail,
      readTime: blog.readTime,
      status: blog.status,
      commentsCount: comments.filter(
        (comment) => comment.blogId === blog._id.toString()
      ).length,
      createdAt: blog.createdAt,
    }));

    res.json({
      success: true,
      message: "Blogs fetched successfully",
      data: formattedBlogs,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blogs",
    });
  }
});

app.post("/api/blogs", verifyJwt, async (req: TAuthRequest, res: Response) => {
  try {
    const data = req.body;

    if (
      !data.title ||
      !data.bookTitle ||
      !data.category ||
      !data.excerpt ||
      !data.content
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required blog information",
      });
    }

    const words = String(data.content).trim().split(/\s+/).length;
    const readTime = `${Math.max(1, Math.ceil(words / 180))} min read`;

    const blog: TBlog = {
      title: data.title,
      bookTitle: data.bookTitle,
      category: data.category,
      coverImage: data.coverImage || "",
      excerpt: data.excerpt,
      content: data.content,
      authorName: req.user?.name || "",
      authorEmail: req.user?.email || "",
      readTime,
      status: "Published",
      createdAt: new Date(),
    };

    const db = await connectDB();
    const result = await db.collection("blogs").insertOne(blog);

    res.status(201).json({
      success: true,
      message: "Blog published successfully",
      data: {
        id: result.insertedId.toString(),
        commentsCount: 0,
        ...blog,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to publish blog",
    });
  }
});

app.get("/api/blogs/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog id",
      });
    }

    const db = await connectDB();
    const blog = await db.collection("blogs").findOne({
      _id: new ObjectId(id),
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const comments = await db
      .collection("blogComments")
      .find({ blogId: id })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({
      success: true,
      message: "Blog fetched successfully",
      data: {
        id: blog._id.toString(),
        title: blog.title,
        bookTitle: blog.bookTitle,
        category: blog.category,
        coverImage: blog.coverImage,
        excerpt: blog.excerpt,
        content: blog.content,
        authorName: blog.authorName,
        authorEmail: blog.authorEmail,
        readTime: blog.readTime,
        status: blog.status,
        commentsCount: comments.length,
        createdAt: blog.createdAt,
        comments: comments.map((comment) => ({
          id: comment._id.toString(),
          blogId: comment.blogId,
          comment: comment.comment,
          userName: comment.userName,
          userEmail: comment.userEmail,
          createdAt: comment.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blog",
    });
  }
});

app.post(
  "/api/blogs/:id/comments",
  verifyJwt,
  async (req: TAuthRequest, res: Response) => {
  try {
    const blogId = String(req.params.id);
    const { comment } = req.body;
    const userName = req.user?.name || "";
    const userEmail = req.user?.email || "";

    if (!ObjectId.isValid(blogId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid blog id",
      });
    }

    if (!comment || !userName || !userEmail) {
      return res.status(400).json({
        success: false,
        message: "Comment, user name, and email are required",
      });
    }

    const db = await connectDB();
    const blog = await db.collection("blogs").findOne({
      _id: new ObjectId(blogId),
    });

    if (!blog) {
      return res.status(404).json({
        success: false,
        message: "Blog not found",
      });
    }

    const newComment: TBlogComment = {
      blogId,
      comment,
      userName,
      userEmail,
      createdAt: new Date(),
    };

    const result = await db.collection("blogComments").insertOne(newComment);

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      data: {
        id: result.insertedId.toString(),
        ...newComment,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
    });
  }
});

app.delete(
  "/api/books/:id",
  verifyJwt,
  async (req: TAuthRequest, res: Response) => {
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

    if (book.ownerEmail !== req.user?.email) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You can only delete your own book listings.",
      });
    }

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
