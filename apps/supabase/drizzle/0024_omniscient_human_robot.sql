ALTER TABLE "node_to_playground" DROP CONSTRAINT "node_to_playground_node_id_node_data_id_fk";
--> statement-breakpoint
ALTER TABLE "playground" ALTER COLUMN "layout" SET DEFAULT '[{"i":"inspector","x":0,"y":0,"w":2,"h":2,"resizeHandles":["s","w","e","n"]},{"i":"rete","x":2,"y":0,"w":10,"h":12,"minW":4,"resizeHandles":["s","w","e","n"]}]'::json;