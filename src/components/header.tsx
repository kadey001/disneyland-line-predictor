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
                <div className="flex-none flex items-center gap-2">
                    <Link
                        href="/realtime-test"
                        className="h-9 w-9 flex items-center justify-center text-primary hover:bg-white/20 rounded-md opacity-0 hover:opacity-100 transition-opacity"
                        aria-label="Go to realtime test page"
                        title="Realtime Test Page"
                    >
                        🧪
                    </Link>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
