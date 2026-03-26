import "server-only";
import type { Transaction } from "sequelize";
import { getModels } from "@/lib/models";

type QueryOptions = {
  transaction?: Transaction;
};

export async function listOwnedProjects(userId: string, options: QueryOptions = {}) {
  const { Project } = getModels();

  return Project.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    transaction: options.transaction,
  });
}

export async function findOwnedProject(userId: string, projectId: string, options: QueryOptions = {}) {
  const { Project } = getModels();

  return Project.findOne({
    where: {
      id: projectId,
      userId,
    },
    transaction: options.transaction,
  });
}

export async function findOwnedPage(userId: string, pageId: string, options: QueryOptions = {}) {
  const { Page, Project } = getModels();

  return Page.findOne({
    where: { id: pageId },
    include: [
      {
        model: Project,
        as: "project",
        attributes: [],
        required: true,
        where: { userId },
      },
    ],
    transaction: options.transaction,
  });
}

export async function listOwnedPagesForProject(userId: string, projectId: string, options: QueryOptions = {}) {
  const { Page, Project } = getModels();

  return Page.findAll({
    where: { projectId },
    include: [
      {
        model: Project,
        as: "project",
        attributes: [],
        required: true,
        where: { userId },
      },
    ],
    order: [
      ["isEffective", "DESC"],
      ["createdAt", "DESC"],
    ],
    transaction: options.transaction,
  });
}

export async function findEffectiveOwnedPageForProject(
  userId: string,
  projectId: string,
  options: QueryOptions = {},
) {
  const { Page, Project } = getModels();

  return Page.findOne({
    where: {
      projectId,
      isEffective: true,
    },
    include: [
      {
        model: Project,
        as: "project",
        attributes: [],
        required: true,
        where: { userId },
      },
    ],
    order: [["createdAt", "DESC"]],
    transaction: options.transaction,
  });
}

export async function listOwnedPhotos(userId: string, options: QueryOptions = {}) {
  const { Photo } = getModels();

  return Photo.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    transaction: options.transaction,
  });
}

export async function findOwnedPhoto(userId: string, photoId: string, options: QueryOptions = {}) {
  const { Photo } = getModels();

  return Photo.findOne({
    where: {
      id: photoId,
      userId,
    },
    transaction: options.transaction,
  });
}
