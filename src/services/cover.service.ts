import { AppError } from "../errors/AppError";
import { prisma } from "../lib/prisma";
import { storageService } from "../storage/storageDocuments";

interface Cover {
    cursoID: string;
    file?: Express.Multer.File;
}

export class UploadCoverService {
    async execute({ cursoID, file }: Cover) {
        if (!file) {
            throw new AppError("Capa obrigatória");
        }

        const curso = await prisma.curso.findFirst({
            where: {
                id: cursoID,
            },
        });

        if (!curso) {
            throw new AppError("Curso não encontrado");
        }

        const subpasta = "covers";
        const { nomeArquivo, caminho } = await storageService.salvar(
            file.buffer,
            file.originalname,
            subpasta,
            storageService.getBucketImagem(),
            file.mimetype
        );

        const uploadedCover = await prisma.capa.create({
            data: {
                nomeArquivo,
                nomeOriginal: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                path: caminho
            },
        });

        await prisma.curso.update({
            where: {
                id: cursoID,
            },
            data: {
                Capa: {
                    connect: { id: uploadedCover.id },
                },
            },
        });
    }
}

export class ShowCoverService {
    async execute({ cursoID }: Cover) {
        const curso = await prisma.curso.findFirst({
            where: {
                id: cursoID
            },
            include: {
                Capa: true,
            },
        });

        if (!curso) {
            throw new AppError("Curso não encontrado");
        }

        if (!curso.Capa) {
            throw new AppError("Imagem não encontrada");
        }

        return curso.Capa.path;
    }
}
