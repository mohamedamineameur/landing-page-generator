import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  literal,
} from "sequelize";
import { getSequelize } from "@/lib/sequelize";

export class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> {
  declare id: CreationOptional<string>;
  declare username: string;
  declare passwordHash: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export class Project extends Model<InferAttributes<Project>, InferCreationAttributes<Project>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare userId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

export class Page extends Model<InferAttributes<Page>, InferCreationAttributes<Page>> {
  declare id: CreationOptional<string>;
  declare projectId: string;
  declare isEffective: CreationOptional<boolean>;
  declare payload: unknown;
  declare createdAt: CreationOptional<Date>;
}

export class Photo extends Model<InferAttributes<Photo>, InferCreationAttributes<Photo>> {
  declare id: CreationOptional<string>;
  declare userId: string;
  declare alt: CreationOptional<string | null>;
  declare descrip: CreationOptional<string | null>;
  declare link: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

type DbModels = {
  User: typeof User;
  Project: typeof Project;
  Page: typeof Page;
  Photo: typeof Photo;
};

const globalForModels = globalThis as typeof globalThis & {
  __dbModels__?: DbModels;
  __dbSyncPromise__?: Promise<DbModels> | null;
};

function initializeModels() {
  if (globalForModels.__dbModels__) {
    return globalForModels.__dbModels__;
  }

  const sequelize = getSequelize();

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: literal("gen_random_uuid()"),
      },
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          len: [3, 255],
        },
      },
      passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
        field: "password_hash",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("NOW()"),
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("NOW()"),
        field: "updated_at",
      },
    },
    {
      sequelize,
      modelName: "User",
      tableName: "users",
      timestamps: true,
      underscored: true,
    },
  );

  Project.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: literal("gen_random_uuid()"),
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("NOW()"),
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("NOW()"),
        field: "updated_at",
      },
    },
    {
      sequelize,
      modelName: "Project",
      tableName: "projects",
      timestamps: true,
      underscored: true,
    },
  );

  Page.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: literal("gen_random_uuid()"),
      },
      projectId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "project_id",
      },
      isEffective: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_effective",
      },
      payload: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("NOW()"),
        field: "created_at",
      },
    },
    {
      sequelize,
      modelName: "Page",
      tableName: "pages",
      timestamps: false,
    },
  );

  Photo.init(
    {
      id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
        defaultValue: literal("gen_random_uuid()"),
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "user_id",
      },
      alt: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      descrip: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      link: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("NOW()"),
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: literal("NOW()"),
        field: "updated_at",
      },
    },
    {
      sequelize,
      modelName: "Photo",
      tableName: "photos",
      timestamps: true,
      underscored: true,
    },
  );

  User.hasMany(Project, {
    foreignKey: "userId",
    as: "projects",
  });
  Project.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });
  Project.hasMany(Page, {
    foreignKey: "projectId",
    as: "pages",
  });
  Page.belongsTo(Project, {
    foreignKey: "projectId",
    as: "project",
  });
  User.hasMany(Photo, {
    foreignKey: "userId",
    as: "photos",
  });
  Photo.belongsTo(User, {
    foreignKey: "userId",
    as: "user",
  });

  globalForModels.__dbModels__ = {
    User,
    Project,
    Page,
    Photo,
  };

  return globalForModels.__dbModels__;
}

export function getModels() {
  return initializeModels();
}

export async function syncDatabase() {
  const models = getModels();

  if (!globalForModels.__dbSyncPromise__) {
    globalForModels.__dbSyncPromise__ = (async () => {
      const sequelize = getSequelize();

      await sequelize.query("CREATE EXTENSION IF NOT EXISTS pgcrypto");
      await sequelize.sync();

      return models;
    })().catch((error) => {
      globalForModels.__dbSyncPromise__ = null;
      throw error;
    });
  }

  return globalForModels.__dbSyncPromise__;
}
