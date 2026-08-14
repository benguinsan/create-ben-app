# Feature — Terraform AWS (S3 + EC2 + CloudFront)

## Goal

Add optional **AWS infrastructure via Terraform** as an A-flat overlay: `templates/terraform-aws/`, interactive confirm **Would you like to create AWS infrastructure with Terraform?**, and scaffold merge so selecting it overlays onto `templates/default` (and any other selected features) without baking Terraform into the CNA primitive.

Default stack is **simple only**: **S3**, **EC2**, and **CloudFront**. Skipping the option leaves no Terraform / AWS files.

## Skills read

- No Terraform / AWS skill in `AGENTS.md` §3 — **do not invent** `.agents/skills/terraform` or `.agents/skills/aws`.
- `AGENTS.md` §1 A-flat overlays, §6 optional modules, §7 feature selection, §8 scaffolding, §9 template file rules.
- Mirror the Docker opt-in pattern (`prompts/docker.md`): confirm + `--flag` / `--no-flag` + isolatable overlay + next-steps (do not clobber app `README.md`).

## Existing code inspected

- `AGENTS.md` — optional features are 1 folder = 1 tech; Docker is the closest analogue (confirm yes/no). Terraform / AWS is **not** documented yet and must be added as an opt-in (never in `templates/default`).
- `src/index.ts` — intro → name → Auth → Env → Linter → Docker confirm → scaffold; flags `--auth`, `--env`, `--linter`, `--docker` / `--no-docker`; `FLAG_VALUE_SKIP` + positional parser; next-steps are feature-aware. No Terraform prompt/flag yet.
- `src/scaffold.ts` — `FeatureId = "clerk-auth" | "t3-env" | "oxlint-oxfmt" | "docker"`; text processing includes `Dockerfile` / `.dockerignore`; `.tf` / `.tfvars` are **not** in `TEXT_EXTENSIONS` yet (needed for `{{name}}` placeholders).
- `templates/docker/` — overlay pattern: isolatable files + `package.json` script merge; **no** app `README.md` overwrite.
- `templates/terraform-aws/` — does not exist.
- `README.md` — optional-features table and flags do not mention Terraform/AWS.

## Decisions / assumptions

1. **Interactive prompt:** after Docker (last current confirm, before scaffold), ask via `@clack/prompts` `confirm`:
   - message: **Would you like to create AWS infrastructure with Terraform?**
   - `initialValue: false` (opt-in)
   - yes → include `terraform-aws` overlay; no → skip
   - Cancel → cancel message + exit non-zero.
2. **Non-interactive / CI:** support `--terraform` (force yes) and `--no-terraform` (force no). When both are passed, error and exit 1 (same as Docker). When not a TTY and neither flag is set, default to **no**. Log a dim summary when flag-driven.
3. **Scaffold:** extend `FeatureId` with `"terraform-aws"`. Overlay order stays insertion order from `resolveFeatures` (append `terraform-aws` after Docker). Same placeholders (`{{name}}`, `{{description}}`).
4. **Treat Terraform sources as text:** in `shouldProcessAsText` / `TEXT_EXTENSIONS`, include `.tf`, `.tfvars`, and basename `terraform.tfvars.example` (and `.hcl` if used) so `{{name}}` substitutes. Do not treat `.terraform/` or state files as templates (do not ship them).
5. **Overlay contents (isolatable, simple default):**

   Structure **each stack as a Terraform module** (one folder per service). Put **root wiring** (provider + module calls + env inputs) under `environment/`, split into **`dev`** and **`prod`**. Do **not** put S3 / EC2 / CloudFront resources in flat `s3.tf` / `ec2.tf` / `cloudfront.tf` files, and do **not** leave `versions.tf` / `main.tf` / `variables.tf` / `outputs.tf` at the `terraform/` root.

   Generated layout (all under the app root). Module and environment folder names are **lowercase** so they stay portable across case-sensitive filesystems:

   ```text
   terraform/
     README.md                # short apply/destroy notes (folder-local; do NOT overwrite app README.md)
     environment/
       dev/
         versions.tf          # terraform >= 1.5; hashicorp/aws ~> 5.0
         variables.tf         # env inputs only
         outputs.tf           # re-export module outputs
         main.tf              # provider + module "s3" / "ec2" / "cloudfront" calls
         terraform.tfvars.example
       prod/
         versions.tf
         variables.tf
         outputs.tf
         main.tf
         terraform.tfvars.example
     modules/
       s3/
         main.tf
         variables.tf
         outputs.tf
       ec2/
         main.tf
         variables.tf
         outputs.tf
       cloudfront/
         main.tf
         variables.tf
         outputs.tf
   ```

   Each environment is its own Terraform root (separate state). `dev` and `prod` share the same modules; they differ only by **variable defaults / tfvars** (name suffix, tags, instance size) — do not fork module source per env.

   Environment `main.tf` wires stacks only — no resource blocks for S3/EC2/CloudFront in `environment/*`:

   ```hcl
   module "s3" {
     source = "../../modules/s3"
     # pass env variables
   }

   module "ec2" {
     source = "../../modules/ec2"
     # pass env variables
   }

   module "cloudfront" {
     source = "../../modules/cloudfront"
     # pass env variables + module.s3 / module.ec2 outputs as needed
   }
   ```

   Keep `dev/main.tf` and `prod/main.tf` the same shape (same module calls). Put env-specific values in that env’s `variables.tf` defaults and `terraform.tfvars.example` (e.g. `environment = "dev"` vs `"prod"`, `instance_type = "t3.micro"` vs `"t3.small"`, `project_name` includes `-dev` / `-prod`).

   Each module folder **must** contain exactly the trio `main.tf`, `variables.tf`, `outputs.tf` (plus nothing else required in v1 — no nested modules, no `versions.tf` inside modules unless a module-level provider is unavoidable; **prefer no `provider` blocks inside modules** — configure AWS only in `environment/dev` and `environment/prod`).

   Optional `package.json` fragment with convenience scripts only (no new npm runtime deps). Point `-chdir` at an environment, defaulting docs/scripts to **dev**:

   - `tf:init:dev` / `tf:plan:dev` / `tf:apply:dev` / `tf:destroy:dev` → `terraform -chdir=terraform/environment/dev …`
   - `tf:init:prod` / `tf:plan:prod` / `tf:apply:prod` / `tf:destroy:prod` → `terraform -chdir=terraform/environment/prod …`

   Optional `.gitignore` overlay **append** is not supported by the copier (overlay files replace). **Do not overwrite** the app `.gitignore`. Put Terraform ignore rules in `terraform/.gitignore` instead:

   - `.terraform/`
   - `*.tfstate`
   - `*.tfstate.*`
   - `crash.log`
   - `override.tf` / `override.tf.json` / `*_override.tf`
   - `terraform.tfvars` (keep `*.example` committed)
   - Keep `.terraform.lock.hcl` **unignored** (users may commit it after `init`)

6. **Default architecture (keep it simple — only these three services):**

   Assume the **default VPC** (data sources for default VPC + subnets). No custom VPC, no ALB, no RDS, no Route53, no ACM, no ECS/Lambda. CloudFront uses the default `*.cloudfront.net` domain (no custom cert).

   ```text
   Internet
      │
      ▼
   CloudFront
      ├─ default (*)     → EC2 :80     (Next.js app origin)
      └─ /assets*        → S3 (OAC)    (private bucket for static objects)
   ```

   **S3** (`modules/s3/`)

   - Private bucket; name derived from `{{name}}` (sanitize to S3 rules: lowercase, add a random/account-unique suffix via `random_id` or `bucket_prefix` so global names do not collide).
   - Block all public access.
   - Bucket policy: CloudFront OAC only (`aws_cloudfront_origin_access_control` — not legacy OAI). If the OAC resource must live next to the distribution, create it in `modules/cloudfront` and pass the OAC ID + distribution ARN into the S3 module for the bucket policy (or keep OAC + policy in `s3` and pass the CloudFront ARN in — pick one direction, avoid cycles: **S3 then EC2 then CloudFront** in each environment `main.tf`; CloudFront consumes S3/EC2 outputs; S3 bucket policy may need the CloudFront distribution ARN — if that creates a cycle, use the OAC-only policy pattern that does not depend on the distribution, or a separate `aws_s3_bucket_policy` in the CloudFront module targeting `module.s3.bucket_id`).
   - No website hosting block (CloudFront is the public edge).
   - Module outputs: bucket id, bucket ARN, bucket regional domain name.

   **EC2** (`modules/ec2/`)

   - `t3.micro` (variable, default `t3.micro`).
   - Amazon Linux 2023 AMI via SSM public parameter (or `data.aws_ami`).
   - Default-VPC subnet with a public IP (VPC data sources belong in this module or in the environment root and passed in — prefer inside `ec2` so the module is self-contained).
   - Security group: ingress `80` from `0.0.0.0/0` (CloudFront + health), `22` from `var.ssh_cidr` (default `0.0.0.0/0` with a comment to restrict), egress all.
   - Minimal `user_data` comment/stub only (install Node / run Next.js later) — **do not** bake a full deploy pipeline, Docker-on-EC2, or SSM session manager module in v1.
   - Optional `key_name` variable defaulting to `null` (instance can be created without a key pair).
   - Module outputs: instance id, public DNS, public IP, security group id.

   **CloudFront** (`modules/cloudfront/`)

   - Inputs: S3 bucket regional domain name + bucket id, EC2 public DNS (from the other modules, passed in each environment `main.tf`).
   - Default cache behavior → EC2 custom origin (`http-only`, origin protocol HTTP, origin port 80). Cache policy: CachingDisabled (or managed `CachingDisabled`) so Next.js SSR is not wrongly cached.
   - Ordered behavior `assets*` (or `/assets*`) → S3 origin with OAC. Use a managed caching-optimized policy for that path.
   - IPv6 enabled; default certificate (`cloudfront_default_certificate`).
   - No WAF, no custom domain, no Lambda@Edge.
   - Module outputs: distribution id, domain name, OAC id (if created here).

   **Environment variables** (`terraform/environment/{dev,prod}/variables.tf` + `terraform.tfvars.example`) — pass through to modules; do not duplicate resource logic in the environment roots:

   - `aws_region` (default `us-east-1`)
   - `project_name` (default substituted `{{name}}`; include env in the example tfvars, e.g. `{{name}}-dev` / `{{name}}-prod`)
   - `environment` (`"dev"` or `"prod"` — used in tags / name prefixes)
   - `instance_type` (dev default `t3.micro`; prod default `t3.small`)
   - `ssh_cidr` (default `0.0.0.0/0`)
   - `key_name` (optional, default `null`)

   Each module’s `variables.tf` declares only what that module needs (e.g. EC2 does not take S3 bucket names).

   **Environment outputs** (`terraform/environment/{dev,prod}/outputs.tf`): re-export S3 bucket name, EC2 public DNS / IP, CloudFront domain name, CloudFront distribution id from `module.s3` / `module.ec2` / `module.cloudfront`.

7. **Next-steps:** when Terraform is selected, append:

   - pick an environment (`dev` or `prod`); start with **dev**
   - `cd terraform/environment/dev && terraform init && terraform plan`
   - reminder: configure AWS credentials (`AWS_PROFILE` / `aws configure`) — never commit keys
   - `terraform apply` / `terraform destroy` **inside that environment folder** (dev and prod have separate state)
   - note that local `npm run dev` does not require AWS

   Keep existing Auth / Env / Docker next-steps when those features are also selected.

8. **Do not overwrite** app `README.md` or `.gitignore` from this overlay (avoids clobbering Clerk/default/docker). Usage lives in `terraform/README.md` + CLI next-steps.

9. **Scope of this slice:** Terraform confirm + flags + `templates/terraform-aws` + `FeatureId` wiring + `AGENTS.md` / package `README.md` catalog rows. Do not add RDS, VPC modules, GitHub Actions deploy, Docker-on-EC2, or other cloud providers.

10. **Out of scope:** Kubernetes, ECS/Fargate, Lambda/SST/CDK, Terraform Cloud remote backend (local state is OK for the starter; document that remote state is a later choice), `templates/default` infra files.

## Files likely to change

| Path | Change |
|------|--------|
| `AGENTS.md` | Document Terraform AWS as an opt-in overlay (layout, stack, feature table, prompt list, architecture, next-steps). Never in `default`. |
| `README.md` | Optional-features table + `--terraform` / `--no-terraform` flags |
| `src/index.ts` | Confirm after Docker; flags; `resolveFeatures`; Terraform-aware next steps; skip `--terraform` / `--no-terraform` in positional name parser |
| `src/scaffold.ts` | Add `"terraform-aws"` to `FeatureId`; treat `.tf` / `.tfvars` as text |
| `templates/terraform-aws/**` | New overlay (see layout above) |
| `templates/default/**` | **No** Terraform / AWS files |
| `.agents/skills/**` | **No** new skill |
| `prompts/terraform-aws.md` | This prompt (already created) |

## Implementation requirements

1. Clack `confirm` with the exact product wording; handle `isCancel`.
2. Only copy `templates/terraform-aws` when the user confirms (or `--terraform`).
3. Overlay must be isolatable: skip/delete folder ⇒ no Terraform artifacts in generated apps.
4. Terraform must `terraform fmt` clean (HCL formatted) and use explicit `required_providers` in **each environment root** only (`environment/dev`, `environment/prod`).
5. Each stack is a local module under `terraform/modules/<stack>/` with `main.tf`, `variables.tf`, and `outputs.tf`. Each environment `main.tf` only calls those modules via `source = "../../modules/<stack>"`.
6. Split wiring into `terraform/environment/dev` and `terraform/environment/prod`. Shared modules stay under `terraform/modules/`. No `main.tf` / `versions.tf` / `variables.tf` / `outputs.tf` at the `terraform/` root.
7. Resource names / tags include `project_name` / `{{name}}` and the environment (`dev` / `prod`).
8. Do not put `@clack/prompts` / `picocolors` into the generated app.
9. Do not put AWS access keys, secret keys, or account IDs in templates. Credentials stay on the AWS provider chain.
10. Update `AGENTS.md` consistently with Docker: template-layout bullet, “not in default” list, Container-adjacent **Infrastructure** subsection, feature-selection table row, prompt-files list, architecture overlay list. Document **environment/dev + environment/prod** plus **module-per-stack** (`modules/s3`, `modules/ec2`, `modules/cloudfront`).
11. Update package `README.md` options table and flags.

## Security requirements

- No secrets in `.tf` files or `terraform.tfvars.example` (placeholders / empty optional vars only).
- S3 is private; public access blocked; only CloudFront OAC can read objects.
- Do not enable S3 website public ACLs.
- SSH `0.0.0.0/0` is allowed as a **starter default** but must be called out in `terraform/README.md` as something to restrict.
- State files and `terraform.tfvars` must be gitignored under `terraform/.gitignore`.
- Do not create IAM users with access keys in Terraform. Instance role is out of scope for v1 (default instance profile none).
- Document that `terraform apply` **in each environment** creates billable AWS resources (S3, EC2, CloudFront). Applying both `dev` and `prod` creates **two** stacks. `terraform destroy` must be run in that same environment folder to tear it down.

## Acceptance criteria

- [ ] Answering **no** (or `--no-terraform` / non-TTY default) scaffolds without a `terraform/` directory.
- [ ] Answering **yes** (or `--terraform`) produces `terraform/environment/dev` and `terraform/environment/prod`, each with `main.tf` / `variables.tf` / `outputs.tf` / `versions.tf` / `terraform.tfvars.example`, **and** `terraform/modules/{s3,ec2,cloudfront}` each containing `main.tf`, `variables.tf`, `outputs.tf`, plus `terraform/README.md`. No `main.tf` / `versions.tf` at the `terraform/` root. No flat `s3.tf` / `ec2.tf` / `cloudfront.tf`.
- [ ] `templates/default` remains free of Terraform / AWS files.
- [ ] Cancel during Terraform confirm exits cleanly before scaffold write.
- [ ] Docker-only, Clerk+Docker, and Docker+Terraform paths still work (this overlay does not remove other feature files; no app README clobber).
- [ ] `{{name}}` is substituted in Terraform variables / tags / example tfvars.
- [ ] CLI `npm run typecheck` / `npm run build` pass; smoke scaffold yes/no paths.
- [ ] `AGENTS.md` and package `README.md` list the new option.

## Checks to run

From `create-my-custom-app/`:

```bash
npm run typecheck
npm run build
```

Smoke:

```bash
# Terraform = no
node dist/index.js tf-skip-demo --auth none --env none --linter eslint --no-docker --no-terraform
# confirm: no terraform/ directory

# Terraform = yes
node dist/index.js tf-yes-demo --auth none --env none --linter eslint --no-docker --terraform
# confirm: terraform/environment/{dev,prod}/{main,variables,outputs,versions}.tf
# terraform/environment/{dev,prod}/terraform.tfvars.example
# terraform/modules/{s3,ec2,cloudfront}/{main,variables,outputs}.tf
# terraform/README.md
# no terraform/main.tf at the terraform root; no flat s3.tf / ec2.tf / cloudfront.tf
# next-steps mention terraform/environment/dev init/plan/apply
# no AWS keys in generated files
```

Optional (requires Terraform + AWS credentials — do not run apply in CI):

```bash
cd tf-yes-demo/terraform && terraform fmt -recursive -check
terraform -chdir=environment/dev init -backend=false && terraform -chdir=environment/dev validate
terraform -chdir=environment/prod init -backend=false && terraform -chdir=environment/prod validate
```

Do **not** `terraform apply` as part of automated checks.

## Exact manual test steps (after implementation)

1. `cd create-my-custom-app && npm run build`
2. `node dist/index.js tf-no-app --auth none --no-docker --no-terraform` → no `terraform/` folder.
3. `node dist/index.js tf-yes-app --auth none --no-docker --terraform` → confirm `terraform/environment/dev` and `terraform/environment/prod` each have `main.tf` / `variables.tf` / `outputs.tf` / `versions.tf`; `terraform/modules/{s3,ec2,cloudfront}` each have `main.tf` / `variables.tf` / `outputs.tf`; environment `main.tf` only `module` blocks with `source = "../../modules/…"`; next-steps include **dev** init/plan/apply and a billing/destroy reminder.
4. Cancel at Terraform confirm → cancel message, non-zero exit, no project written.
5. `node dist/index.js tf-docker-app --auth none --docker --terraform` → Docker files **and** `terraform/` both present; app `README.md` still default (neither overlay overwrites it).
6. Grep generated `terraform/` for access-key / secret patterns — none.
7. Optional locally: `terraform -chdir=tf-yes-app/terraform fmt -recursive -check`, then `terraform -chdir=tf-yes-app/terraform/environment/dev init && terraform -chdir=tf-yes-app/terraform/environment/dev validate` (repeat for `prod`).
