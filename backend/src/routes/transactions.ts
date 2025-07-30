import {Router} from 'express';
import {AlchemyService} from '../services/AlchemyService';
import {TransactionRequest} from '../types';

const router = Router();

router.post('/send', async (req, res, next) => {
    try {
        const {to, data, value} = req.body as TransactionRequest;

        if (!to) {
            return res.status(400).json({
                success: false,
                error: {code: 'MISSING_TO_ADDRESS', message: 'Recipient address is required'}
            });
        }

        const alchemyService = AlchemyService.getInstance();
        const client = alchemyService?.getAlchemyClient();

        if (!client || !client.isAuthenticated()) {
            return res.status(401).json({
                success: false,
                error: {code: 'NOT_AUTHENTICATED', message: 'User not authenticated'}
            });
        }

        // Parse value to BigInt if it's a string
        const parsedValue = value ? (typeof value === 'string' ? BigInt(value) : value) : BigInt(0);

        const result = await client.sendTransaction({
            to,
            data,
            value: parsedValue
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        // Convert BigInt values to strings for JSON serialization
        const serializedResult = {
            ...result,
            data: {
                ...result.data,
                receipt: result.data.receipt ? {
                    ...result.data.receipt,
                    gasUsed: result.data.receipt.gasUsed?.toString(),
                } : undefined,
            }
        };

        res.json(serializedResult);
    } catch (error) {
        next(error);
    }
});

router.get('/:hash', async (req, res, next) => {
    try {
        const {hash} = req.params;

        // For demo purposes, return mock transaction status
        res.json({
            success: true,
            data: {
                hash,
                status: 'success',
                blockNumber: 12345,
                gasUsed: '21000',
                timestamp: Date.now()
            }
        });
    } catch (error) {
        next(error);
    }
});

export {router as transactionRoutes};
