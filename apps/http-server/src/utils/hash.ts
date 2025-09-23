import { createHash } from 'crypto';
export default async function hash(string: string) {
    return createHash('sha256').update(string).digest('hex');
}