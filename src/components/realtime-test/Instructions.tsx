"use client"

interface InstructionsProps {
    show401Error?: boolean
}

export function Instructions({ show401Error = false }: InstructionsProps) {
    return (
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">How to Test Real-time Updates</h2>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-200">
                <li><strong>Fix Authentication:</strong> Update your Supabase anon key in the .env file</li>
                <li><strong>Verify Project:</strong> Ensure your Supabase project exists and is active</li>
                <li><strong>Restart Server:</strong> Restart your Next.js development server after updating .env</li>
                <li><strong>Test Connection:</strong> Click the "Test" button to verify authentication works</li>
                <li><strong>Check Permissions:</strong> Ensure RLS policies allow your anon key to read data</li>
                <li><strong>Test Real-time:</strong> Run your Go service to see live updates</li>
            </ol>
            {show401Error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                    <p className="text-sm text-red-700 dark:text-red-300">
                        <strong>🚨 401 Error:</strong> This indicates your Supabase anon key is invalid or expired.
                        Follow the steps above to get a fresh key from your Supabase dashboard.
                    </p>
                </div>
            )}
        </div>
    )
}
