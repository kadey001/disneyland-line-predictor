import Link from "next/link";

export default function Home() {

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <h1 className="text-4xl font-bold text-center sm:text-left">
          Disneyland Wait Times Tracker
        </h1>
        <p className="text-lg text-gray-700">
          A web app to track wait time trends and provide insights for Disneyland visitors to get the most out of their day.
        </p>
        <Link href='/wait-times'>
          <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            View Wait Times
          </button>
        </Link>
      </main>
    </div>
  );
}
