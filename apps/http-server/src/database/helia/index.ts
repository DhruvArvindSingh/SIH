import { createHelia } from 'helia'
import { json } from '@helia/json'

const helia = await createHelia();
const heliaClient = json(helia);

export default heliaClient;
