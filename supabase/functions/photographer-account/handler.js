// Supabase Edge Function handler for photographer accounts.
// Service credentials remain inside the Edge Function; never returned to the browser.

export async function handle(request, env, createClient) {
  const origin = request.headers.get("Origin") || "";

  // Production domains for CheeseGrad.
  // If ALLOWED_ORIGINS is configured in Supabase Secrets, it will override this default list.
  const defaultAllowedOrigins = [
    "https://cheesegrad.click",
    "https://www.cheesegrad.click",
  ];

  const configuredOrigins = (env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const allowedOrigins =
    configuredOrigins.length > 0 ? configuredOrigins : defaultAllowedOrigins;

  const originAllowed =
    !origin ||
    allowedOrigins.includes(origin);

  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Vary": "Origin",
    "Access-Control-Allow-Headers":
      "authorization,x-client-info,apikey,content-type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
  };

  if (origin && originAllowed) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  const reply = (status, message, extra = {}) =>
    new Response(JSON.stringify({ message, ...extra }), {
      status,
      headers,
    });

  // CORS preflight
  if (request.method === "OPTIONS") {
    if (origin && !originAllowed) {
      return reply(403, "Tên miền chưa được cấp phép.", {
        code: "ORIGIN_NOT_ALLOWED",
      });
    }
    return new Response(null, { status: 204, headers });
  }

  if (origin && !originAllowed) {
    return reply(403, "Tên miền chưa được cấp phép.", {
      code: "ORIGIN_NOT_ALLOWED",
    });
  }

  if (request.method !== "POST") {
    return reply(405, "Phương thức không hỗ trợ.", {
      code: "METHOD_NOT_ALLOWED",
    });
  }

  const url = env.get("SUPABASE_URL");
  const anon = env.get("SUPABASE_ANON_KEY");
  const serviceRole = env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !anon || !serviceRole) {
    return reply(
      503,
      "Chưa cấu hình đầy đủ dịch vụ tài khoản Supabase.",
      { code: "SUPABASE_CONFIG_MISSING" },
    );
  }

  const authorization = request.headers.get("Authorization") || "";

  if (!authorization.startsWith("Bearer ")) {
    return reply(401, "Vui lòng đăng nhập admin.", {
      code: "AUTH_HEADER_MISSING",
    });
  }

  try {
    const token = authorization.slice(7).trim();

    if (!token) {
      return reply(401, "Phiên đăng nhập không hợp lệ.", {
        code: "EMPTY_ACCESS_TOKEN",
      });
    }

    // Client using the logged-in admin session.
    const caller = createClient(url, anon, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const authResult = await caller.auth.getUser(token);

    if (authResult.error || !authResult.data?.user) {
      return reply(401, "Phiên đăng nhập không hợp lệ hoặc đã hết hạn.", {
        code: "INVALID_ADMIN_SESSION",
      });
    }

    // Verify caller is an admin using the existing database RPC.
    const permission = await caller.rpc("is_admin");

    if (permission.error) {
      console.error("is_admin RPC error:", permission.error);
      return reply(503, "Không kiểm tra được quyền admin.", {
        code: "ADMIN_CHECK_FAILED",
      });
    }

    if (permission.data !== true) {
      return reply(403, "Chỉ admin được quản lý tài khoản thợ.", {
        code: "ADMIN_REQUIRED",
      });
    }

    const raw = await request.text();

    if (raw.length > 4096) {
      return reply(413, "Dữ liệu quá dài.", {
        code: "PAYLOAD_TOO_LARGE",
      });
    }

    let body;

    try {
      body = JSON.parse(raw);
    } catch {
      return reply(400, "Dữ liệu không hợp lệ.", {
        code: "INVALID_JSON",
      });
    }

    const photographerId = String(body.photographer_id || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = body.password;

    const validUuid =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        photographerId,
      );

    const validEmail =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

    const validPassword =
      typeof password === "string" &&
      password.length >= 10 &&
      password.length <= 128;

    if (!validUuid || !validEmail || !validPassword) {
      return reply(
        400,
        "Chọn thợ, nhập email hợp lệ và mật khẩu 10–128 ký tự.",
        { code: "INVALID_INPUT" },
      );
    }

    // Service-role client used only inside the Edge Function.
    const service = createClient(url, serviceRole, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Verify photographer exists.
    const photographer = await service
      .from("photographers")
      .select("id")
      .eq("id", photographerId)
      .maybeSingle();

    if (photographer.error) {
      console.error("photographers query error:", photographer.error);
      return reply(503, "Không đọc được hồ sơ thợ.", {
        code: "PHOTOGRAPHER_QUERY_FAILED",
      });
    }

    if (!photographer.data) {
      return reply(404, "Không tìm thấy hồ sơ thợ.", {
        code: "PHOTOGRAPHER_NOT_FOUND",
      });
    }

    // Prevent an admin email from being assigned to a photographer.
    const admins = await service
      .from("admin_users")
      .select("email");

    if (admins.error) {
      console.error("admin_users query error:", admins.error);
      return reply(503, "Không kiểm tra được quyền tài khoản.", {
        code: "ADMIN_USERS_QUERY_FAILED",
      });
    }

    const isAdminEmail = (value) =>
      (admins.data || []).some(
        (row) =>
          String(row.email || "").trim().toLowerCase() ===
          String(value || "").trim().toLowerCase(),
      );

    if (isAdminEmail(email)) {
      return reply(409, "Không dùng tài khoản admin làm tài khoản thợ.", {
        code: "ADMIN_EMAIL_NOT_ALLOWED",
      });
    }

    // Check whether this photographer already has an account linked.
    const mapping = await service
      .from("photographer_accounts")
      .select("user_id")
      .eq("photographer_id", photographerId)
      .maybeSingle();

    if (mapping.error) {
      console.error("photographer_accounts query error:", mapping.error);
      return reply(503, "Chưa thiết lập được liên kết tài khoản thợ.", {
        code: "ACCOUNT_MAPPING_QUERY_FAILED",
      });
    }

    // Existing mapping: only allow resetting the password for the same email.
    if (mapping.data?.user_id) {
      const existing = await service.auth.admin.getUserById(
        mapping.data.user_id,
      );

      if (existing.error || !existing.data?.user) {
        console.error("getUserById error:", existing.error);
        return reply(409, "Không đọc được tài khoản đã liên kết.", {
          code: "LINKED_USER_NOT_FOUND",
        });
      }

      const existingEmail = String(existing.data.user.email || "")
        .trim()
        .toLowerCase();

      if (!existingEmail || isAdminEmail(existingEmail)) {
        return reply(409, "Liên kết tài khoản cần quản trị kiểm tra lại.", {
          code: "INVALID_LINKED_ACCOUNT",
        });
      }

      if (existingEmail !== email) {
        return reply(
          409,
          "Email đã được liên kết. Chỉ đặt mật khẩu mới cho email hiện tại.",
          {
            code: "EMAIL_ALREADY_LINKED",
            email: existingEmail,
          },
        );
      }

      const updated = await service.auth.admin.updateUserById(
        mapping.data.user_id,
        { password },
      );

      if (updated.error) {
        console.error("updateUserById error:", updated.error);
        return reply(
          400,
          "Không đặt được mật khẩu. Kiểm tra chính sách mật khẩu trong Supabase.",
          {
            code: "PASSWORD_UPDATE_FAILED",
          },
        );
      }

      return reply(200, "Đã đặt mật khẩu mới.", {
        email,
        updated: true,
      });
    }

    // Create a brand-new Supabase Auth user.
    const created = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (created.error || !created.data?.user) {
      console.error("createUser error:", created.error);

      const errorText = String(created.error?.message || "").toLowerCase();

      if (
        errorText.includes("already") ||
        errorText.includes("registered") ||
        errorText.includes("exists")
      ) {
        return reply(
          409,
          "Email này đã tồn tại trong Supabase Auth nhưng chưa liên kết với thợ.",
          {
            code: "AUTH_EMAIL_EXISTS",
          },
        );
      }

      return reply(
        409,
        "Không tạo được tài khoản. Kiểm tra email và chính sách mật khẩu trong Supabase.",
        {
          code: "AUTH_CREATE_FAILED",
        },
      );
    }

    const authUserId = created.data.user.id;

    // Link Auth user to the photographer record.
    const linked = await service
      .from("photographer_accounts")
      .insert({
        user_id: authUserId,
        photographer_id: photographerId,
      });

    if (linked.error) {
      console.error("photographer_accounts insert error:", linked.error);

      // Roll back the Auth user to avoid leaving an orphaned account.
      const cleanup = await service.auth.admin.deleteUser(authUserId);

      if (cleanup.error) {
        console.error("rollback deleteUser error:", cleanup.error);
        return reply(
          409,
          "Đã tạo tài khoản Auth nhưng liên kết hồ sơ thợ thất bại. Hãy kiểm tra Supabase Auth trước khi thử lại.",
          {
            code: "ACCOUNT_LINK_FAILED_CLEANUP_FAILED",
          },
        );
      }

      return reply(
        409,
        "Không liên kết được tài khoản với thợ. Tài khoản Auth vừa tạo đã được hoàn tác.",
        {
          code: "ACCOUNT_LINK_FAILED",
        },
      );
    }

    return reply(200, "Đã tạo và liên kết tài khoản với thợ.", {
      email,
      created: true,
      user_id: authUserId,
    });
  } catch (error) {
    console.error("photographer-account unhandled error:", error);

    return reply(500, "Không xử lý được yêu cầu. Vui lòng thử lại.", {
      code: "INTERNAL_ERROR",
    });
  }
}
