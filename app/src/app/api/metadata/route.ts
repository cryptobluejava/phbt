import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const uri = searchParams.get('uri');

    if (!uri) {
        return NextResponse.json({ error: 'Missing uri parameter' }, { status: 400 });
    }

    try {
        // Validate URL
        const url = new URL(uri);

        // Only allow http/https protocols
        if (!['http:', 'https:'].includes(url.protocol)) {
            return NextResponse.json({ error: 'Invalid protocol' }, { status: 400 });
        }

        const response = await fetch(uri, {
            headers: {
                'Accept': 'application/json',
            },
            // Timeout after 10 seconds
            signal: AbortSignal.timeout(10000),
        });

        if (!response.ok) {
            // Return empty object instead of error - let frontend handle missing image gracefully
            console.warn(`Metadata fetch failed for ${uri}: ${response.status}`);
            return NextResponse.json({ image: null, name: null, symbol: null });
        }

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        console.error('Metadata proxy error:', error);
        // Return empty object instead of 500 - let frontend show fallback gracefully
        return NextResponse.json({ image: null, name: null, symbol: null });
    }
}
