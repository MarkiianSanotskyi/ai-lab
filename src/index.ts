import 'dotenv/config';
import OpenAI from 'openai';


async function main() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OPENAI_API_KEY environment variable is not in .env file');
    }

    const client = new OpenAI({ apiKey });

    const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {role: "system", content: "You are a concise assistant for a senior web developer."},
            { role: "user", content: "Say hello in one short sentence." }
        ],
    });

    console.log(response.choices[0]?.message?.content);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});