import type { Request, Response } from "express";
import { postgresClient as prisma } from "../database/index.js";

export default async function dashboardGet(req: Request, res: Response): Promise<void> {
    try {
        const email = req.body.email; // email comes from the verify middleware

        if (!email) {
            res.status(400).json({
                success: false,
                message: "Email not found in request",
                error: "VALIDATION_ERROR"
            });
            return;
        }

        if (!prisma) {
            res.status(500).json({
                success: false,
                message: "Database connection not available",
                error: "DATABASE_ERROR"
            });
            return;
        }

        // Fetch all complaint types for the user
        const [potholes, garbage, fallenTrees, brokenSigns, streetLights, graffiti] = await Promise.all([
            prisma.pothole.findMany({
                where: { email },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.garbage.findMany({
                where: { email },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.fallenTree.findMany({
                where: { email },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.brokenSign.findMany({
                where: { email },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.streetLight.findMany({
                where: { email },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.graffiti.findMany({
                where: { email },
                orderBy: { createdAt: 'desc' }
            })
        ]);

        // Transform data to include issue type for each complaint
        const allComplaints = [
            ...potholes.map(item => ({ ...item, type: 'Pothole' })),
            ...garbage.map(item => ({ ...item, type: 'Garbage' })),
            ...fallenTrees.map(item => ({ ...item, type: 'Fallen Tree' })),
            ...brokenSigns.map(item => ({ ...item, type: 'Broken Sign' })),
            ...streetLights.map(item => ({ ...item, type: 'Street Light' })),
            ...graffiti.map(item => ({ ...item, type: 'Graffiti' }))
        ];

        // Sort all complaints by creation date (newest first)
        allComplaints.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Calculate summary statistics
        const summary = {
            total: allComplaints.length,
            byType: {
                pothole: potholes.length,
                garbage: garbage.length,
                fallenTree: fallenTrees.length,
                brokenSign: brokenSigns.length,
                streetLight: streetLights.length,
                graffiti: graffiti.length
            },
            byStatus: {
                pending: allComplaints.filter(c => c.status === 'Pending').length,
                inProgress: allComplaints.filter(c => c.status === 'In Progress').length,
                resolved: allComplaints.filter(c => c.status === 'Resolved').length,
                rejected: allComplaints.filter(c => c.status === 'Rejected').length
            }
        };

        // Transform complaints for response (remove sensitive data, parse JSON fields)
        const complaintsData = allComplaints.map(complaint => {
            const parsedMlDetections = complaint.mlDetections ?
                (() => {
                    try {
                        return JSON.parse(complaint.mlDetections);
                    } catch {
                        return null;
                    }
                })() : null;

            const parsedPlaceTypes = complaint.placeTypes ?
                (() => {
                    try {
                        return JSON.parse(complaint.placeTypes);
                    } catch {
                        return null;
                    }
                })() : null;

            return {
                id: complaint.id,
                type: complaint.type,
                status: complaint.status,
                city: complaint.city,
                district: complaint.district,
                roadName: complaint.roadName,
                state: complaint.state,
                country: complaint.country,
                postalCode: complaint.postalCode,
                neighborhood: complaint.neighborhood,
                landmark: complaint.landmark,
                formattedAddress: complaint.formattedAddress,
                placeTypes: parsedPlaceTypes,
                coordinates: {
                    latitude: complaint.latitude,
                    longitude: complaint.longitude
                },
                originalImageUrl: complaint.originalS3URL,
                finalImageUrl: complaint.finalS3URL,
                heliaDID: complaint.heliaDID,
                mlDetections: parsedMlDetections,
                mlPriority: complaint.mlPriority,
                mlConfidence: complaint.mlConfidence,
                totalDetections: complaint.totalDetections,
                createdAt: complaint.createdAt,
                updatedAt: complaint.updatedAt
            };
        });

        res.status(200).json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: {
                summary,
                complaints: complaintsData
            }
        });

    } catch (error) {
        console.error("Dashboard fetch error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch dashboard data",
            error: "DATABASE_ERROR"
        });
    }
}
