export type ChunkedDataType = {
    index: number,
    content: string
};

const chunk_size = parseInt(process.env.DATA_CHUNK_SIZE!, 10);
const chunk_overlap = parseInt(process.env.DATA_CHUNK_OVERLAP!, 10);

// Separators tried in order, largest structural unit first.
// Falls back to smaller units only if a chunk is still too big.
const SEPARATORS = ["\n\n", "\n", ". ", " ", ""];

function splitOnSeparator(text: string, separator: string): string[] {
    if (separator === "") {
        return text.split("");
    }
    return text.split(separator);
}

/**
 * Recursively splits `text` into pieces no larger than `maxSize`,
 * trying the biggest/most meaningful separator first and falling
 * back to smaller ones only when needed.
 */
function recursiveSplit(text: string, separators: string[], maxSize: number): string[] {
    if (text.length <= maxSize) {
        return [text];
    }

    const [separator, ...remainingSeparators] = separators;

    // If we've run out of separators, hard-split by character.
    if (separator === undefined) {
        const chunks: string[] = [];
        for (let i = 0; i < text.length; i += maxSize) {
            chunks.push(text.slice(i, i + maxSize));
        }
        return chunks;
    }

    const pieces = splitOnSeparator(text, separator).filter(p => p.length > 0);
    const results: string[] = [];
    let buffer = "";

    for (const piece of pieces) {
        const candidate = buffer ? buffer + separator + piece : piece;

        if (candidate.length <= maxSize) {
            buffer = candidate;
        } else {
            if (buffer) {
                results.push(buffer);
            }
            // Piece itself might still be too big — recurse with smaller separators
            if (piece.length > maxSize) {
                results.push(...recursiveSplit(piece, remainingSeparators, maxSize));
                buffer = "";
            } else {
                buffer = piece;
            }
        }
    }

    if (buffer) {
        results.push(buffer);
    }

    return results;
}

/**
 * Applies overlap between consecutive chunks by pulling trailing
 * characters from the previous chunk into the start of the next one.
 */

function applyOverlap(chunks: string[], overlap: number): string[] {
    if (chunks.length === 0) {
        return [];
    }

    if (overlap <= 0 || chunks.length <= 1) {
        return chunks;
    }

    const overlapped: string[] = [chunks[0]!];

    for (let i = 1; i < chunks.length; i++) {
        const prev = chunks[i - 1]!;
        const overlapText = prev.slice(
            Math.max(0, prev.length - overlap)
        );

        overlapped.push(overlapText + chunks[i]);
    }

    return overlapped;
}

async function chunkData(text: string): Promise<ChunkedDataType[]> {
    if (!text || text.length === 0) {
        return [];
    }

    if (isNaN(chunk_size) || chunk_size <= 0) {
        throw new Error("DATA_CHUNK_SIZE must be a positive integer");
    }
    if (isNaN(chunk_overlap) || chunk_overlap < 0 || chunk_overlap >= chunk_size) {
        throw new Error("DATA_CHUNK_OVERLAP must be a non-negative integer smaller than DATA_CHUNK_SIZE");
    }

    const rawChunks = recursiveSplit(text, SEPARATORS, chunk_size);
    const finalChunks = applyOverlap(rawChunks, chunk_overlap);

    return finalChunks.map((content, index) => ({
        index,
        content
    }));
}

export { chunkData };