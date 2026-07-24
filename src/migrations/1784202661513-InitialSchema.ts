import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1784202661513 implements MigrationInterface {
    name = 'InitialSchema1784202661513'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "team_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "team_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_11c823f69a675c3f05d0fc31958" UNIQUE ("user_id", "team_id"), CONSTRAINT "PK_053171f713ec8a2f09ed58f08f7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "topics" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "team_id" uuid, "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e4aa99a3fa60ec3a37d1fc4e853" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "topic_teamscoped_unique" ON "topics" ("organization_id", "team_id", "name") WHERE "team_id" IS NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "topic_orgwide_unique" ON "topics" ("organization_id", "name") WHERE "team_id" IS NULL`);
        await queryRunner.query(`CREATE TABLE "teams" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7e5523774a38b08a6236d322403" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."organization_memberships_role_enum" AS ENUM('owner', 'admin', 'member')`);
        await queryRunner.query(`CREATE TYPE "public"."organization_memberships_status_enum" AS ENUM('pending', 'active')`);
        await queryRunner.query(`CREATE TABLE "organization_memberships" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "organization_id" uuid NOT NULL, "role" "public"."organization_memberships_role_enum" NOT NULL DEFAULT 'member', "status" "public"."organization_memberships_status_enum" NOT NULL DEFAULT 'pending', "invited_at" TIMESTAMP NOT NULL DEFAULT now(), "joined_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_caa73db1b161fa6b3a042290fe7" UNIQUE ("user_id", "organization_id"), CONSTRAINT "PK_cd7be805730a4c778a5f45364af" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" text NOT NULL, "password_hash" text NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."content_status_histories_from_status_enum" AS ENUM('idea', 'draft', 'ready', 'posted')`);
        await queryRunner.query(`CREATE TYPE "public"."content_status_histories_to_status_enum" AS ENUM('idea', 'draft', 'ready', 'posted')`);
        await queryRunner.query(`CREATE TABLE "content_status_histories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "content_id" uuid NOT NULL, "from_status" "public"."content_status_histories_from_status_enum", "to_status" "public"."content_status_histories_to_status_enum" NOT NULL, "changed_by" uuid NOT NULL, "changed_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c443ce8786cf17955830768dd7a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_098a8e0936e283817035861c70" ON "content_status_histories" ("content_id", "changed_at") `);
        await queryRunner.query(`CREATE TYPE "public"."content_ideas_content_type_enum" AS ENUM('reel', 'carousel', 'other')`);
        await queryRunner.query(`CREATE TYPE "public"."content_ideas_status_enum" AS ENUM('idea', 'draft', 'ready', 'posted')`);
        await queryRunner.query(`CREATE TABLE "content_ideas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "team_id" uuid NOT NULL, "topic_id" uuid, "handled_by" uuid NOT NULL, "created_by" uuid NOT NULL, "title" text NOT NULL, "description" text NOT NULL, "content_type" "public"."content_ideas_content_type_enum" NOT NULL, "week_start_date" date, "scheduled_date" date, "status" "public"."content_ideas_status_enum" NOT NULL DEFAULT 'idea', "deleted_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ad58be47794a30f1ac2a78f60a7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f4cb632fa607a0061271a782a6" ON "content_ideas" ("team_id", "status") `);
        await queryRunner.query(`ALTER TABLE "team_memberships" ADD CONSTRAINT "FK_c9eb2ded8e0e2f4bcb41fd0984a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "team_memberships" ADD CONSTRAINT "FK_b917b8603c6d5c526fcdb2009de" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "topics" ADD CONSTRAINT "FK_d6e23a188e344f235ad92d0cab9" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "topics" ADD CONSTRAINT "FK_70578bafb8b79cc83e741b10e20" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "teams" ADD CONSTRAINT "FK_fdc736f761896ccc179c823a785" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_5352fc550034d507d6c76dd2901" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_memberships" ADD CONSTRAINT "FK_86ae2efbb9ce84dd652e0c96a49" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_status_histories" ADD CONSTRAINT "FK_5b855f8c14fcdbd87fc58a2a29a" FOREIGN KEY ("content_id") REFERENCES "content_ideas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_status_histories" ADD CONSTRAINT "FK_b7d82e9e0c72edc2851ed8bc887" FOREIGN KEY ("changed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_ideas" ADD CONSTRAINT "FK_fe98d5d5307a46ab538a92e2f2c" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_ideas" ADD CONSTRAINT "FK_f505da840ef5274afb8eb699f33" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_ideas" ADD CONSTRAINT "FK_8aa5cf6c493ef031f76204e7c5a" FOREIGN KEY ("handled_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "content_ideas" ADD CONSTRAINT "FK_f66190418a44b0f0c1dddf80660" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "content_ideas" DROP CONSTRAINT "FK_f66190418a44b0f0c1dddf80660"`);
        await queryRunner.query(`ALTER TABLE "content_ideas" DROP CONSTRAINT "FK_8aa5cf6c493ef031f76204e7c5a"`);
        await queryRunner.query(`ALTER TABLE "content_ideas" DROP CONSTRAINT "FK_f505da840ef5274afb8eb699f33"`);
        await queryRunner.query(`ALTER TABLE "content_ideas" DROP CONSTRAINT "FK_fe98d5d5307a46ab538a92e2f2c"`);
        await queryRunner.query(`ALTER TABLE "content_status_histories" DROP CONSTRAINT "FK_b7d82e9e0c72edc2851ed8bc887"`);
        await queryRunner.query(`ALTER TABLE "content_status_histories" DROP CONSTRAINT "FK_5b855f8c14fcdbd87fc58a2a29a"`);
        await queryRunner.query(`ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_86ae2efbb9ce84dd652e0c96a49"`);
        await queryRunner.query(`ALTER TABLE "organization_memberships" DROP CONSTRAINT "FK_5352fc550034d507d6c76dd2901"`);
        await queryRunner.query(`ALTER TABLE "teams" DROP CONSTRAINT "FK_fdc736f761896ccc179c823a785"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "FK_70578bafb8b79cc83e741b10e20"`);
        await queryRunner.query(`ALTER TABLE "topics" DROP CONSTRAINT "FK_d6e23a188e344f235ad92d0cab9"`);
        await queryRunner.query(`ALTER TABLE "team_memberships" DROP CONSTRAINT "FK_b917b8603c6d5c526fcdb2009de"`);
        await queryRunner.query(`ALTER TABLE "team_memberships" DROP CONSTRAINT "FK_c9eb2ded8e0e2f4bcb41fd0984a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f4cb632fa607a0061271a782a6"`);
        await queryRunner.query(`DROP TABLE "content_ideas"`);
        await queryRunner.query(`DROP TYPE "public"."content_ideas_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."content_ideas_content_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_098a8e0936e283817035861c70"`);
        await queryRunner.query(`DROP TABLE "content_status_histories"`);
        await queryRunner.query(`DROP TYPE "public"."content_status_histories_to_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."content_status_histories_from_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "organization_memberships"`);
        await queryRunner.query(`DROP TYPE "public"."organization_memberships_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."organization_memberships_role_enum"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP TABLE "teams"`);
        await queryRunner.query(`DROP INDEX "public"."topic_orgwide_unique"`);
        await queryRunner.query(`DROP INDEX "public"."topic_teamscoped_unique"`);
        await queryRunner.query(`DROP TABLE "topics"`);
        await queryRunner.query(`DROP TABLE "team_memberships"`);
    }

}
