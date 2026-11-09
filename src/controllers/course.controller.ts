import { Request, Response } from 'express';
import { CourseService, UsuarioLogado } from '../services/course.service';

const courseService = new CourseService();

function getUsuarioLogado(req: Request): UsuarioLogado {
  const user = req.user;

  if (!user) {
    throw new Error("Usuário não autenticado.");
  }

  const cargos = user.permissions ?? [];

  const cargo: UsuarioLogado["cargo"] =
    cargos.includes("DEPPI")
      ? "DEPPI"
      : cargos.includes("ADMIN")
        ? "ADMIN"
        : cargos.includes("PROFESSOR")
          ? "PROFESSOR"
          : "ALUNO";

  return {
    userId: user.userId,
    cargo,
  };
}

export class CourseController {
  async create(req: Request, res: Response) {
    try {
      const usuarioLogado = getUsuarioLogado(req);
      const curso = await courseService.createCourse(req.body, usuarioLogado);
      return res.status(201).json({ message: "Curso criado com sucesso. ", data: curso });
    } catch (error: any) {
      const status = error.message.includes("Acesso negado") ? 403 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      const usuarioLogado = getUsuarioLogado(req);
      const cursos = await courseService.readCourses(usuarioLogado);
      return res.status(200).json({ data: cursos });
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async findOne(req: Request, res: Response) {
    try {
      const usuarioLogado = getUsuarioLogado(req);
      const id = req.params.id as string;
      
      const curso = await courseService.readCourseById(id, usuarioLogado);
      return res.status(200).json({ data: curso });
    } catch (error: any) {
      const status = error.message.includes("Não encontrado. ") ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const usuarioLogado = getUsuarioLogado(req);
      const id = req.params.id as string;
      
      const curso = await courseService.updateCourse(id, req.body, usuarioLogado);
      return res.status(200).json({ message: "Curso atualizado com sucesso.", data: curso });
    } catch (error: any) {
      const status =
  error.message.includes("Acesso negado.") ||
  error.message.includes("Apenas o DEPPI")
    ? 403
    : error.message.includes("Não encontrado.")
      ? 404
      : 400;
      return res.status(status).json({ error: error.message });
    }
  }

  async remove(req: Request, res: Response) {
    try {
      const id = req.params.id as string;
      
      await courseService.deleteCourse(id);
      return res.status(200).json({ message: "Curso removido com sucesso." });
    } catch (error: any) {
      const status = error.message.includes("Acesso negado. ") ? 403
        : error.message.includes("Não encontrado.") ? 404 : 400;
      return res.status(status).json({ error: error.message });
    }
  }
}
