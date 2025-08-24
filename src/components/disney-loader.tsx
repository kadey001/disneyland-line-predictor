export default function DisneyLoader() {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
            <div className="flex flex-col items-center space-y-4">
                <div className="relative w-24 h-24">
                    {/* Disney Castle SVG */}
                    <svg
                        viewBox="0 0 100 100"
                        className="w-full h-full text-white"
                        fill="currentColor"
                    >
                        {/* Castle base */}
                        <rect x="10" y="60" width="80" height="35" />

                        {/* Main tower */}
                        <rect x="40" y="30" width="20" height="40" />
                        <polygon points="40,30 50,15 60,30" />

                        {/* Side towers */}
                        <rect x="20" y="45" width="15" height="25" />
                        <polygon points="20,45 27.5,35 35,45" />

                        <rect x="65" y="45" width="15" height="25" />
                        <polygon points="65,45 72.5,35 80,45" />

                        {/* Small corner towers */}
                        <rect x="5" y="55" width="10" height="15" />
                        <polygon points="5,55 10,48 15,55" />

                        <rect x="85" y="55" width="10" height="15" />
                        <polygon points="85,55 90,48 95,55" />

                        {/* Castle details */}
                        <rect x="45" y="40" width="3" height="8" />
                        <rect x="52" y="40" width="3" height="8" />
                        <rect x="42" y="75" width="16" height="15" />
                        <path d="M42 75 L50 68 L58 75 Z" />

                        {/* Flag */}
                        <line x1="50" y1="15" x2="50" y2="8" stroke="currentColor" strokeWidth="1" />
                        <polygon points="50,8 50,12 58,10" />
                    </svg>

                    {/* Animated Sparkles */}
                    <div className="absolute inset-0">
                        {/* Sparkle 1 */}
                        <div className="absolute top-2 left-4 w-2 h-2 text-yellow-300">
                            <div className="animate-ping">✨</div>
                        </div>

                        {/* Sparkle 2 */}
                        <div className="absolute top-6 right-2 w-2 h-2 text-yellow-200" style={{ animationDelay: '0.5s' }}>
                            <div className="animate-ping">✨</div>
                        </div>

                        {/* Sparkle 3 */}
                        <div className="absolute bottom-4 left-2 w-2 h-2 text-yellow-400" style={{ animationDelay: '1s' }}>
                            <div className="animate-ping">✨</div>
                        </div>

                        {/* Sparkle 4 */}
                        <div className="absolute bottom-2 right-6 w-2 h-2 text-yellow-100" style={{ animationDelay: '1.5s' }}>
                            <div className="animate-ping">✨</div>
                        </div>

                        {/* Sparkle 5 */}
                        <div className="absolute top-8 left-8 w-2 h-2 text-yellow-300" style={{ animationDelay: '2s' }}>
                            <div className="animate-ping">✨</div>
                        </div>

                        {/* Sparkle 6 */}
                        <div className="absolute top-12 right-8 w-2 h-2 text-yellow-200" style={{ animationDelay: '2.5s' }}>
                            <div className="animate-ping">✨</div>
                        </div>
                    </div>
                </div>
                <p className="text-white text-lg font-medium">Loading magical wait times...</p>
            </div>
        </div>
    );
}
