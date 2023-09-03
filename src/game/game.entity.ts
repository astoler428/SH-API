import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import {Game} from "../models/game.model";

@Entity()
export class GameEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number

  @Column('jsonb')
  game: Game
}

