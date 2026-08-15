import { DataTypes, Model, Optional, } from 'sequelize';
import sequelize from '@/config/database.config';
import { Role } from './Role.model';
import { UserProfile } from './UserProfile.model';

// User attributes interface
export interface UserAttributes {
  id: number;
  roleId: number;
  username: string;
  email: string;
  passwordHash: string;
  phone?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// User creation attributes (optional fields)
export interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'lastLoginAt' | 'createdAt' | 'updatedAt' | 'deletedAt'> {}

// User model class
export class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  // Remove public class field declarations to avoid shadowing Sequelize getters/setters
  declare id: number;
  declare roleId: number;
  declare username: string;
  declare email: string;
  declare passwordHash: string;
  declare phone?: string;
  declare status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  declare lastLoginAt?: Date;

  // Timestamps
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
  declare readonly deletedAt?: Date;

  // Associations
  public role!: Role;
  public profile!: UserProfile;

  // Association methods
  public getRoleData!: () => Promise<Role>;
  public getProfile!: () => Promise<UserProfile>;
  public createProfile!: (profileData: any) => Promise<UserProfile>;

  // Static associations
  public static associations: {
    role: Association<User, Role>;
    profile: Association<User, UserProfile>;
  };

  // Instance methods
  public getFullName(): string {
    return this.profile?.fullName || this.username;
  }

  public isActive(): boolean {
    return this.status === 'ACTIVE';
  }

  public hasRole(roleName: string): boolean {
    return this.role?.name === roleName;
  }

  public hasAnyRole(roleNames: string[]): boolean {
    return roleNames.includes(this.role?.name);
  }

  public updateLastLogin(): Promise<User> {
    return this.update({ lastLoginAt: new Date() });
  }

  public toSafeJSON(): Partial<UserAttributes> {
    const { passwordHash, ...safeUser } = this.toJSON();
    return safeUser;
  }

  // Static methods
  public static async findByEmail(email: string): Promise<User | null> {
    return this.findOne({
      where: { email },
      include: [
        {
          association: 'role',
          attributes: ['id', 'name', 'description']
        },
        {
          association: 'profile',
          attributes: { exclude: [] }
        }
      ]
    });
  }

  public static async findByUsername(username: string): Promise<User | null> {
    return this.findOne({
      where: { username },
      include: [
        {
          association: 'role',
          attributes: ['id', 'name', 'description']
        },
        {
          association: 'profile',
          attributes: { exclude: [] }
        }
      ]
    });
  }

  public static async findActiveUsers(): Promise<User[]> {
    return this.findAll({
      where: { status: 'ACTIVE' },
      include: [
        {
          association: 'role',
          attributes: ['id', 'name', 'description']
        },
        {
          association: 'profile',
          attributes: ['id', 'fullName', 'avatarUrl']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  public static async findByRole(roleName: string): Promise<User[]> {
    return this.findAll({
      include: [
        {
          association: 'role',
          where: { name: roleName },
          attributes: ['id', 'name', 'description']
        },
        {
          association: 'profile',
          attributes: ['id', 'fullName', 'avatarUrl']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
  }

  public static async countByStatus(status: 'ACTIVE' | 'INACTIVE' | 'LOCKED'): Promise<number> {
    return this.count({ where: { status } });
  }

  public static async countByRole(roleName: string): Promise<number> {
    return this.count({
      include: [
        {
          association: 'role',
          where: { name: roleName }
        }
      ]
    });
  }
}

// Initialize the model
User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    roleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: 'role_id',
      references: {
        model: 'roles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT'
    },
    username: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        len: [3, 100],
        notEmpty: true
      }
    },
    email: {
      type: DataTypes.STRING(150),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        len: [5, 150]
      }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'password_hash',
      validate: {
        len: [60, 255] // bcrypt hash length
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        len: [10, 20]
      }
    },
    status: {
      type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'LOCKED'),
      defaultValue: 'ACTIVE',
      allowNull: false
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'last_login_at'
    }
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        fields: ['email']
      },
      {
        fields: ['username']
      },
      {
        fields: ['role_id']
      },
      {
        fields: ['status']
      },
      {
        fields: ['email', 'status']
      }
    ]
  }
);

export default User;
