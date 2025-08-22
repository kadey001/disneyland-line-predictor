import Link from "next/link";

export default function Header() {
    return (
        <header>
            <div className="flex items-center bg-red-500 text-white p-4 shadow-md">
                <div className="flex-none">
                    <Link href="/dashboard" className="text-white hover:underline">
                        Dashboard
                    </Link>
                </div>
                <div className="grow">
                    <h1 className="text-2xl font-bold text-center">Disneyland Wait Times</h1>
                </div>
                <div className="ml-auto flex-none">
                    <Link href="/" className="text-white hover:underline">
                        Home
                    </Link>
                </div>
            </div>
        </header>
    );
}
