import { Injectable } from "@nestjs/common";
import { CustomRepositoryCannotInheritRepositoryError, DataSource, EntityRepository, Repository } from "typeorm";
import { GameEntity } from "./game.entity";

@Injectable()
export class GameRepository extends Repository<GameEntity>{
  constructor(private dataSource: DataSource) {
    super(GameEntity, dataSource.createEntityManager());
  }

  // async customFind(id: string){
  //   const gameEntity = await this.findOne({where: {game: {id: id}}})
  //   console.log(gameEntity)
  //   return gameEntity.game
  // }
}