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

function getMongoUri() {
  return env.MONGODB_URI.replace(
    "@cluster0.exh2zgz.mongodb.net/?appName=Cluster0",
    "@ac-8wcx1qf-shard-00-00.exh2zgz.mongodb.net:27017,ac-8wcx1qf-shard-00-01.exh2zgz.mongodb.net:27017,ac-8wcx1qf-shard-00-02.exh2zgz.mongodb.net:27017/?ssl=true&authSource=admin&replicaSet=atlas-hpoy7r-shard-0&retryWrites=true&w=majority&appName=Cluster0"
  ).replace("mongodb+srv://", "mongodb://");
}

const books = [
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    shortDescription: "A fantasy adventure about Bilbo Baggins and an unexpected journey.",
    fullDescription: "Good paperback copy with light cover wear. The pages are clean and the spine is firm. A wonderful read for fantasy lovers who enjoy classic adventure stories.",
    price: 340,
    genre: "Fiction",
    condition: "Good",
    location: "Lalmatia, Dhaka",
    language: "English",
    edition: "Paperback, HarperCollins Edition",
    imageUrl: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Harry Potter and the Philosopher's Stone",
    author: "J.K. Rowling",
    shortDescription: "The first book in the Harry Potter fantasy series.",
    fullDescription: "Used copy in good reading condition. Cover has minor edge marks but all pages are intact. Best for young readers or collectors starting the series.",
    price: 390,
    genre: "Fiction",
    condition: "Good",
    location: "Baily Road, Dhaka",
    language: "English",
    edition: "Paperback, Bloomsbury Edition",
    imageUrl: "https://images.unsplash.com/photo-1513001900722-370f803f498d?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "JavaScript: The Good Parts",
    author: "Douglas Crockford",
    shortDescription: "A concise programming book about the strongest parts of JavaScript.",
    fullDescription: "Small technical book in fair condition. Some pages have notes, but the content is readable and complete. Useful for frontend learners and JavaScript beginners.",
    price: 310,
    genre: "Technology",
    condition: "Fair",
    location: "Khilgaon, Dhaka",
    language: "English",
    edition: "Paperback, 2008",
    imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Eloquent JavaScript",
    author: "Marijn Haverbeke",
    shortDescription: "A practical introduction to JavaScript programming and problem solving.",
    fullDescription: "Clean paperback with only a few pencil marks. Great for students learning modern JavaScript fundamentals through examples and exercises.",
    price: 500,
    genre: "Technology",
    condition: "Good",
    location: "Halishahar, Chattogram",
    language: "English",
    edition: "Third Edition, Paperback",
    imageUrl: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Refactoring",
    author: "Martin Fowler",
    shortDescription: "A software engineering book about improving existing code safely.",
    fullDescription: "Good condition copy with a strong spine and clean pages. Ideal for developers who want to write better maintainable applications.",
    price: 820,
    genre: "Technology",
    condition: "Good",
    location: "Uttara Sector 7, Dhaka",
    language: "English",
    edition: "Second Edition, Paperback",
    imageUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Cracking the Coding Interview",
    author: "Gayle Laakmann McDowell",
    shortDescription: "Interview preparation guide with coding problems and explanations.",
    fullDescription: "Large paperback in good condition. There are light marks in some problem sections, but all pages are readable. Useful for job interview preparation.",
    price: 880,
    genre: "Technology",
    condition: "Good",
    location: "Shahbag, Dhaka",
    language: "English",
    edition: "6th Edition, Paperback",
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Good to Great",
    author: "Jim Collins",
    shortDescription: "Business lessons about companies that made lasting improvements.",
    fullDescription: "Used but clean copy. The cover has small corner wear, pages are clear, and there are no missing pages. Suitable for business and leadership readers.",
    price: 430,
    genre: "Business",
    condition: "Good",
    location: "Gulshan 1, Dhaka",
    language: "English",
    edition: "Paperback, 2001",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "The Hard Thing About Hard Things",
    author: "Ben Horowitz",
    shortDescription: "Startup leadership lessons from difficult business situations.",
    fullDescription: "Like new paperback with clean pages and no writing inside. Great for startup founders and readers interested in practical management lessons.",
    price: 560,
    genre: "Business",
    condition: "Like New",
    location: "Banani DOHS, Dhaka",
    language: "English",
    edition: "Paperback, 2014",
    imageUrl: "https://images.unsplash.com/photo-1553729459-efe14ef6055d?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Rework",
    author: "Jason Fried and David Heinemeier Hansson",
    shortDescription: "A short business book about simple, focused ways to build work.",
    fullDescription: "Compact paperback in very good condition. Easy to read and full of practical ideas for small teams, freelancers, and entrepreneurs.",
    price: 330,
    genre: "Business",
    condition: "Like New",
    location: "Nasirabad, Chattogram",
    language: "English",
    edition: "Paperback, 2010",
    imageUrl: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Dare to Lead",
    author: "Brene Brown",
    shortDescription: "A leadership book about courage, trust, and honest communication.",
    fullDescription: "Good copy with clean pages. The cover is neat and the binding is solid. Useful for readers interested in team leadership and personal growth.",
    price: 440,
    genre: "Business",
    condition: "Good",
    location: "Chashara, Narayanganj",
    language: "English",
    edition: "Paperback, 2018",
    imageUrl: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Man's Search for Meaning",
    author: "Viktor E. Frankl",
    shortDescription: "A powerful book about meaning, suffering, and human resilience.",
    fullDescription: "Clean paperback in good condition. No missing pages and no heavy markings. A thoughtful read for anyone interested in purpose and psychology.",
    price: 350,
    genre: "Self-development",
    condition: "Good",
    location: "Moulvibazar Sadar, Moulvibazar",
    language: "English",
    edition: "Paperback, Beacon Press",
    imageUrl: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "The Power of Habit",
    author: "Charles Duhigg",
    shortDescription: "A book about habit loops, behavior change, and daily routines.",
    fullDescription: "Good condition copy with light use. Pages are clean and the cover has only small signs of handling. Suitable for readers who liked Atomic Habits.",
    price: 390,
    genre: "Self-development",
    condition: "Good",
    location: "Cumilla Cantonment, Cumilla",
    language: "English",
    edition: "Paperback, 2014",
    imageUrl: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Make Time",
    author: "Jake Knapp and John Zeratsky",
    shortDescription: "A practical guide to focusing on what matters every day.",
    fullDescription: "Like new copy with no writing inside. Lightweight paperback, clean cover, and clear pages. Great for productivity readers and busy students.",
    price: 370,
    genre: "Self-development",
    condition: "Like New",
    location: "Akhalia, Sylhet",
    language: "English",
    edition: "Paperback, 2018",
    imageUrl: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Grit",
    author: "Angela Duckworth",
    shortDescription: "A psychology-backed book about passion, persistence, and achievement.",
    fullDescription: "Good condition paperback with a few underlined sentences. All pages are complete and easy to read. Helpful for students and self-improvement readers.",
    price: 410,
    genre: "Self-development",
    condition: "Good",
    location: "Shaheb Bazar, Rajshahi",
    language: "English",
    edition: "Paperback, 2016",
    imageUrl: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "The Diary of a Young Girl",
    author: "Anne Frank",
    shortDescription: "A historical memoir from World War II told through a young girl's diary.",
    fullDescription: "Used paperback in good condition. Pages are slightly aged but complete. A meaningful read for history, memoir, and literature readers.",
    price: 260,
    genre: "Memoir",
    condition: "Good",
    location: "Kushtia Sadar, Kushtia",
    language: "English",
    edition: "Paperback, Definitive Edition",
    imageUrl: "https://images.unsplash.com/photo-1526243741027-444d633d7365?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Becoming",
    author: "Michelle Obama",
    shortDescription: "A memoir about family, identity, leadership, and public life.",
    fullDescription: "Good hardcover copy with a clean dust jacket. Pages are neat and binding is firm. Perfect for readers who enjoy inspiring memoirs.",
    price: 620,
    genre: "Memoir",
    condition: "Good",
    location: "Bogra Sadar, Bogura",
    language: "English",
    edition: "Hardcover, 2018",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Long Walk to Freedom",
    author: "Nelson Mandela",
    shortDescription: "The autobiography of Nelson Mandela and South Africa's freedom struggle.",
    fullDescription: "Fair condition copy with visible cover use, but pages are complete and readable. A valuable historical memoir for serious readers.",
    price: 500,
    genre: "Memoir",
    condition: "Fair",
    location: "New Market, Dhaka",
    language: "English",
    edition: "Paperback, 1995",
    imageUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "The Selfish Gene",
    author: "Richard Dawkins",
    shortDescription: "A science classic explaining evolution through genes and behavior.",
    fullDescription: "Good condition academic paperback. Some pages have small notes, but the book is complete and readable. Useful for biology and science readers.",
    price: 460,
    genre: "Academic",
    condition: "Good",
    location: "BAU Campus, Mymensingh",
    language: "English",
    edition: "40th Anniversary Edition",
    imageUrl: "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Database System Concepts",
    author: "Abraham Silberschatz, Henry F. Korth, S. Sudarshan",
    shortDescription: "A textbook covering database design, SQL, transactions, and storage.",
    fullDescription: "Used academic textbook in fair condition. Cover has marks from use, but pages are readable and complete. Good for CSE students studying databases.",
    price: 900,
    genre: "Academic",
    condition: "Fair",
    location: "DU Campus, Dhaka",
    language: "English",
    edition: "Sixth Edition, Hardcover",
    imageUrl: "https://images.unsplash.com/photo-1535905557558-afc4877a26fc?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Principles of Economics",
    author: "N. Gregory Mankiw",
    shortDescription: "A widely used economics textbook for introductory university courses.",
    fullDescription: "Large textbook in good condition with clean pages. Some corners are slightly bent. Useful for business, economics, and social science students.",
    price: 850,
    genre: "Academic",
    condition: "Good",
    location: "Jahangirnagar University, Savar",
    language: "English",
    edition: "Eighth Edition, Paperback",
    imageUrl: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=900&auto=format&fit=crop",
  },
];

async function seedBooks() {
  const client = new MongoClient(getMongoUri(), {
    serverSelectionTimeoutMS: 15000,
  });
  await client.connect();

  const collection = client.db("ReRead").collection("books");
  const now = new Date();

  const docs = books.map((book, index) => ({
    ...book,
    ownerName: "ReRead Demo Seller 2",
    ownerEmail: "seller2@reread.app",
    status: "Active",
    createdAt: new Date(now.getTime() - index * 45 * 60 * 1000),
  }));

  const titles = docs.map((book) => book.title);
  await collection.deleteMany({
    title: { $in: titles },
    ownerEmail: "seller2@reread.app",
  });

  const result = await collection.insertMany(docs);
  const total = await collection.countDocuments();

  console.log(`Inserted ${result.insertedCount} more books into ReRead.books`);
  console.log(`Total books in collection: ${total}`);

  await client.close();
}

seedBooks().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
