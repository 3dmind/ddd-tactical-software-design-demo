# Migration `20201120002849-create-user-table`

This migration has been generated by Christian Wlatschiha at 11/20/2020, 1:28:49 AM.
You can check out the [state of the schema](./schema.prisma) after the migration.

## Database Steps

```sql
CREATE TABLE "BaseUser" (
    "baseUserId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT NOT NULL,
    "userPassword" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY ("baseUserId")
)

CREATE UNIQUE INDEX "BaseUser.userEmail_unique" ON "BaseUser"("userEmail")
```

## Changes

```diff
diff --git schema.prisma schema.prisma
migration 20201022203630-create-task-table..20201120002849-create-user-table
--- datamodel.dml
+++ datamodel.dml
@@ -3,11 +3,22 @@
 }
 datasource db {
   provider = "postgresql"
-  url = "***"
+  url = "***"
 }
+model BaseUserModel {
+  @@map("BaseUser")
+  baseUserId      String    @id
+  updatedAt       DateTime  @updatedAt
+  createdAt       DateTime
+  username        String
+  userPassword    String
+  userEmail       String    @unique
+  isEmailVerified Boolean   @default(false)
+}
+
 model TaskModel {
   @@map("Task")
   taskId      String    @id
   updatedAt   DateTime  @updatedAt
```

