import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface RequestBody {
    model: string;
    messages: { role: string; content: string }[];
}

export async function POST(request: NextRequest) {
    try {
        // Check if API key is set
        if (!process.env.OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }
        console.log(process.env.OPENAI_API_KEY, 'API KEY');
        // Parse and validate request body
        const body: RequestBody = await request.json();

        if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
            return NextResponse.json(
                { error: 'Invalid request: messages array is required' },
                { status: 400 }
            );
        }

        const model = "gpt-4";

        // Call OpenAI API
        const completion = await openai.chat.completions.create({
            model,
            messages: body.messages as any,
        });

        // Return success response
        return NextResponse.json({
            content: completion.choices[0].message.content,
        });
    } catch (error: any) {
        console.error('OpenAI API error:', error);

        // Handle specific OpenAI errors
        if (error.status === 401) {
            return NextResponse.json(
                { error: 'Invalid API key' },
                { status: 401 }
            );
        } else if (error.status === 429) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429 }
            );
        } else if (error.status === 400) {
            return NextResponse.json(
                { error: 'Invalid request to OpenAI API' },
                { status: 400 }
            );
        } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            return NextResponse.json(
                { error: 'Network error' },
                { status: 500 }
            );
        }

        // Generic error
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}