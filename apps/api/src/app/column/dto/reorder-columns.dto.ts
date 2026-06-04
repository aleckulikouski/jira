import { IsArray, IsString } from 'class-validator';

export class ReorderColumnsDto {
  @IsArray()
  @IsString({ each: true })
  orderedIds!: string[];
}
