import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddStatusColumnToDataQueries1684719751591 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'data_queries',
      new TableColumn({
        name: 'status',
        type: 'enum',
        enumName: 'data_queries_status_enum',
        enum: ['draft', 'published'],
        default: `'published'`,
        isNullable: false,
      })
    );

    await queryRunner.changeColumn(
      'data_queries',
      'status',
      new TableColumn({
        name: 'status',
        type: 'enum',
        enumName: 'data_queries_status_enum',
        enum: ['draft', 'published'],
        default: `'draft'`,
        isNullable: false,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('data_queries', 'status');
  }
}
