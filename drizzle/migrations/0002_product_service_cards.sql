ALTER TABLE public.links ADD COLUMN kind text NOT NULL DEFAULT 'link';
ALTER TABLE public.links ADD COLUMN price text;
ALTER TABLE public.links ADD COLUMN description text;
ALTER TABLE public.links ADD CONSTRAINT links_kind_check CHECK (kind IN ('link','product','service'));