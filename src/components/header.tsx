import Image from "next/image";
import Link from "next/link";

export default function Header() {
    return (
        <header>
            <div className="flex items-center bg-red-500 text-white px-4 py-2 shadow-md">
                <div className="flex-none">
                    <Link href="/">
                        <Image
                            src="/logo.png"
                            alt="Disney Logo"
                            width={50}
                            height={50}
                            className="bg-white rounded-full"
                        />
                    </Link>
                </div>
                <div className="grow">
                    <h1 className="text-2xl font-bold text-center">Disneyland Wait Times</h1>
                </div>
            </div>
        </header>
    );
}
