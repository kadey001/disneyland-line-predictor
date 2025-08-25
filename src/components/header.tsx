import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
    return (
        <header>
            <div className="flex items-center bg-header text-white px-4 py-2 shadow-md">
                <div className="flex-none">
                    <Link href="/">
                        <Image
                            src="https://kcr90ci7l2.ufs.sh/f/qmwD8TJNhAVR6yCC5S0FLK3hqPkxOiUGzMnp9tgslfyH8C4Z"
                            alt="Disney Logo"
                            width={50}
                            height={50}
                        />
                    </Link>
                </div>
                <div className="grow">
                    <h1 className="text-2xl font-bold text-center text-primary">Disneyland Wait Times</h1>
                </div>
                <div className="flex-none">
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
