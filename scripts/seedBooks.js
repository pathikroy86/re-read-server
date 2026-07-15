const dns = require("node:dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const fs = require("fs");
const path = require("path");
const { MongoClient } = require("mongodb");

const envPath = path.join(__dirname, "../../re-read-client/.env");
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.trim().startsWith("//") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    })
);

const books = [
  {
    title: "Atomic Habits",
    author: "James Clear",
    shortDescription:
      "A practical guide to building better habits and breaking bad ones.",
    fullDescription:
      "This paperback copy is clean and easy to read. The pages are intact, the cover has light shelf wear, and there are no missing pages. A useful book for anyone who wants a simple habit system.",
    price: 420,
    genre: "Self-development",
    condition: "Like New",
    location: "Dhanmondi, Dhaka",
    language: "English",
    edition: "Paperback, 2018",
    imageUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Clean Code",
    author: "Robert C. Martin",
    shortDescription:
      "A well-known programming book about writing readable, maintainable code.",
    fullDescription:
      "Good condition technical book with some light pencil marks in a few chapters. Binding is strong and all pages are readable. Great for students and junior developers learning software craftsmanship.",
    price: 650,
    genre: "Technology",
    condition: "Good",
    location: "Agrabad, Chattogram",
    language: "English",
    edition: "Paperback, 2008",
    imageUrl:
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "The Psychology of Money",
    author: "Morgan Housel",
    shortDescription:
      "Short lessons about wealth, greed, behavior, and financial decision-making.",
    fullDescription:
      "A carefully used copy with a neat cover and clean pages. No torn pages or heavy markings. Ideal for readers interested in personal finance and long-term money habits.",
    price: 430,
    genre: "Finance",
    condition: "Like New",
    location: "Banani, Dhaka",
    language: "English",
    edition: "Paperback, 2020",
    imageUrl:
      "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "The Alchemist",
    author: "Paulo Coelho",
    shortDescription:
      "A modern classic about dreams, courage, and personal journeys.",
    fullDescription:
      "Good reading copy with mild edge wear. The story pages are clean and the book is lightweight. Perfect for someone who wants an affordable fiction classic.",
    price: 300,
    genre: "Fiction",
    condition: "Good",
    location: "Zindabazar, Sylhet",
    language: "English",
    edition: "Paperback, 25th Anniversary Edition",
    imageUrl:
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Deep Work",
    author: "Cal Newport",
    shortDescription:
      "A productivity book about focus, distraction-free work, and meaningful output.",
    fullDescription:
      "Like new copy with no marks inside. Cover and spine are in excellent condition. Selling because I finished reading and want another reader to benefit from it.",
    price: 450,
    genre: "Self-development",
    condition: "Like New",
    location: "Mirpur, Dhaka",
    language: "English",
    edition: "Paperback, 2016",
    imageUrl:
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Ikigai",
    author: "Hector Garcia and Francesc Miralles",
    shortDescription: "A gentle book about purpose, longevity, and mindful living.",
    fullDescription:
      "Clean paperback with light use. No missing pages and no writing inside. A calming read for anyone interested in lifestyle and personal meaning.",
    price: 380,
    genre: "Self-development",
    condition: "Good",
    location: "Uposhohor, Rajshahi",
    language: "English",
    edition: "Paperback, 2017",
    imageUrl:
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Sapiens",
    author: "Yuval Noah Harari",
    shortDescription:
      "A broad history of humankind from early humans to modern civilization.",
    fullDescription:
      "Good condition copy with a few highlighted lines in the first chapters. Pages are complete and binding is solid. Useful for history and general knowledge readers.",
    price: 520,
    genre: "History",
    condition: "Good",
    location: "Khulna Sadar, Khulna",
    language: "English",
    edition: "Paperback, 2015",
    imageUrl:
      "https://images.unsplash.com/photo-1526243741027-444d633d7365?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Rich Dad Poor Dad",
    author: "Robert T. Kiyosaki",
    shortDescription:
      "A popular personal finance book about money mindset and assets.",
    fullDescription:
      "Readable used copy with some cover wear. No torn pages. Suitable for beginners who want to understand basic money lessons and financial thinking.",
    price: 400,
    genre: "Finance",
    condition: "Fair",
    location: "GEC Circle, Chattogram",
    language: "English",
    edition: "Paperback, 2017",
    imageUrl:
      "https://images.unsplash.com/photo-1601597111158-2fceff292cdc?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Educated",
    author: "Tara Westover",
    shortDescription:
      "A memoir about family, education, survival, and self-discovery.",
    fullDescription:
      "Good condition memoir with clean pages and a strong spine. The cover has minor corner bends. A powerful read for anyone who enjoys real-life stories.",
    price: 480,
    genre: "Memoir",
    condition: "Good",
    location: "Barishal Sadar, Barishal",
    language: "English",
    edition: "Paperback, 2018",
    imageUrl:
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    shortDescription:
      "A classic novel about justice, childhood, and moral courage.",
    fullDescription:
      "Affordable reading copy with aged pages but no missing parts. The text is clear and the binding is usable. Great for literature students and classic fiction readers.",
    price: 280,
    genre: "Fiction",
    condition: "Fair",
    location: "Mohammadpur, Dhaka",
    language: "English",
    edition: "Mass Market Paperback",
    imageUrl:
      "https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "The Pragmatic Programmer",
    author: "Andrew Hunt and David Thomas",
    shortDescription:
      "A practical software development book for thoughtful programmers.",
    fullDescription:
      "Good used copy with minimal markings. All chapters are intact. Recommended for developers who want better habits, cleaner thinking, and stronger project practices.",
    price: 700,
    genre: "Technology",
    condition: "Good",
    location: "Uttara, Dhaka",
    language: "English",
    edition: "20th Anniversary Edition",
    imageUrl:
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Start With Why",
    author: "Simon Sinek",
    shortDescription:
      "A leadership and business book about purpose-driven thinking.",
    fullDescription:
      "Clean paperback copy with light shelf marks. No writing inside. Useful for students, entrepreneurs, and readers interested in leadership and communication.",
    price: 390,
    genre: "Business",
    condition: "Good",
    location: "Bashundhara R/A, Dhaka",
    language: "English",
    edition: "Paperback, 2011",
    imageUrl:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Zero to One",
    author: "Peter Thiel",
    shortDescription:
      "Startup lessons about innovation, monopoly, and building unique companies.",
    fullDescription:
      "Like new copy with crisp pages and clean cover. Best for startup enthusiasts and business students who want concise ideas about technology companies.",
    price: 460,
    genre: "Business",
    condition: "Like New",
    location: "Motijheel, Dhaka",
    language: "English",
    edition: "Hardcover, 2014",
    imageUrl:
      "https://images.unsplash.com/photo-1463320726281-696a485928c7?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    shortDescription:
      "An accessible science classic about time, space, and the universe.",
    fullDescription:
      "Used paperback in good reading condition. There are a few underlined sentences, but all pages are complete. Great for curious readers and science beginners.",
    price: 360,
    genre: "Academic",
    condition: "Good",
    location: "Kumarpara, Sylhet",
    language: "English",
    edition: "Paperback, Updated Edition",
    imageUrl:
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Introduction to Algorithms",
    author: "Thomas H. Cormen",
    shortDescription:
      "A comprehensive academic textbook on algorithms and data structures.",
    fullDescription:
      "Large textbook in fair condition. The cover has visible use, but pages are complete and readable. Useful for computer science students preparing for algorithms courses.",
    price: 950,
    genre: "Academic",
    condition: "Fair",
    location: "RU Campus, Rajshahi",
    language: "English",
    edition: "Third Edition, Hardcover",
    imageUrl:
      "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "The 7 Habits of Highly Effective People",
    author: "Stephen R. Covey",
    shortDescription:
      "A classic self-improvement book about personal and professional effectiveness.",
    fullDescription:
      "Good condition copy with no missing pages. Some light notes on the first few pages. A solid read for anyone building better personal systems.",
    price: 410,
    genre: "Self-development",
    condition: "Good",
    location: "Shantinagar, Dhaka",
    language: "English",
    edition: "Paperback, Revised Edition",
    imageUrl:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "1984",
    author: "George Orwell",
    shortDescription: "A dystopian classic about surveillance, power, and truth.",
    fullDescription:
      "Compact paperback copy in good condition. Pages are slightly yellowed but clean. Excellent for fiction readers and students studying political literature.",
    price: 260,
    genre: "Fiction",
    condition: "Good",
    location: "Nirala, Khulna",
    language: "English",
    edition: "Paperback, Penguin Classics",
    imageUrl:
      "https://images.unsplash.com/photo-1511108690759-009324a90311?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Thinking, Fast and Slow",
    author: "Daniel Kahneman",
    shortDescription:
      "A psychology book about decision-making, bias, and human judgment.",
    fullDescription:
      "Good copy with clean pages and a sturdy spine. A few pages have small corner folds. Valuable for readers interested in psychology, economics, and behavior.",
    price: 540,
    genre: "Academic",
    condition: "Good",
    location: "Nasirabad, Chattogram",
    language: "English",
    edition: "Paperback, 2013",
    imageUrl:
      "https://images.unsplash.com/photo-1519682337058-a94d519337bc?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "The Lean Startup",
    author: "Eric Ries",
    shortDescription:
      "A startup book about testing ideas, learning fast, and building products.",
    fullDescription:
      "Like new copy with no visible damage. Pages are clean and binding is strong. Great for entrepreneurs, product learners, and business students.",
    price: 470,
    genre: "Business",
    condition: "Like New",
    location: "Farmgate, Dhaka",
    language: "English",
    edition: "Paperback, 2011",
    imageUrl:
      "https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Design Patterns",
    author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
    shortDescription:
      "A classic software engineering book about reusable object-oriented design.",
    fullDescription:
      "Used technical book in fair condition. Cover has wear and there are a few highlighted sections, but all pages are present. Useful for advanced programming learners.",
    price: 780,
    genre: "Technology",
    condition: "Fair",
    location: "Mirpur DOHS, Dhaka",
    language: "English",
    edition: "Hardcover, 1994",
    imageUrl:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=900&auto=format&fit=crop",
  },
];

async function seedBooks() {
  const client = new MongoClient(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 15000,
  });
  await client.connect();

  const collection = client.db("ReRead").collection("books");
  const now = new Date();

  const docs = books.map((book, index) => ({
    ...book,
    ownerName: "ReRead Demo Seller",
    ownerEmail: "seller@reread.app",
    status: "Active",
    createdAt: new Date(now.getTime() - index * 60 * 60 * 1000),
  }));

  const titles = docs.map((book) => book.title);
  await collection.deleteMany({
    title: { $in: titles },
    ownerEmail: "seller@reread.app",
  });

  const result = await collection.insertMany(docs);
  console.log(`Inserted ${result.insertedCount} books into ReRead.books`);

  await client.close();
}

seedBooks().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
