const http = require("http");
const fs = require("fs");
const path = require("path");
const db = require("./db");

const server = http.createServer((req, res) => {


    // Add New Course
    if (req.method === "POST" && req.url === "/add-course") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const formData = new URLSearchParams(body);

            const courseName = formData.get("course_name");
            const description = formData.get("description");
            const duration = formData.get("duration");
            const price = formData.get("price");
            const instructor = formData.get("instructor");

            const sql = `
                INSERT INTO courses
                (course_name, description, duration, price,instructor)
                VALUES (?, ?, ?, ?,?)
            `;

            db.query(
                sql,
                [courseName, description, duration, price,instructor],
                (err) => {
                    if (err) {
                        console.log("Add course error:", err.message);
                        res.writeHead(500, {
                            "Content-Type": "text/html; charset=utf-8"
                        });
                        res.end(`
                            <h2>Unable to add course</h2>
                            <p>Please check the database table columns.</p>
                            <a href="/add-course.html">Try Again</a>
                        `);
                        return;
                    }

                    res.writeHead(200, {
                        "Content-Type": "text/html; charset=utf-8"
                    });
                    res.end(`
                        <h2>Course Added Successfully!</h2>
                        <a href="/add-course.html">Add Another Course</a>
                        <br><br>
                        <a href="/admin-dashboard.html">Back to Dashboard</a>
                    `);
                }
            );
        });

        return;
    }

    // Admin Login
    if (req.method === "POST" && req.url === "/admin-login") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const formData = new URLSearchParams(body);
            const email = formData.get("email");
            const password = formData.get("password");

            // Demo admin credentials
            const adminEmail = "admin@example.com";
            const adminPassword = "Admin@123";

            if (email === adminEmail && password === adminPassword) {
                res.writeHead(302, {
                    Location: "/admin-dashboard.html"
                });
                res.end();
            } else {
                res.writeHead(401, {
                    "Content-Type": "text/html; charset=utf-8"
                });
                res.end(`
                    <h2>Invalid Admin Email or Password</h2>
                    <a href="/admin.html">Try Again</a>
                `);
            }
        });

        return;
    }

    // View Registered Students
    if (req.method === "GET" && req.url === "/view-students.html") {
        db.query(
            "SELECT id, name, email, mobile FROM students",
            (err, results) => {
                if (err) {
                    console.log("Students error:", err.message);
                    res.writeHead(500, {
                        "Content-Type": "text/html; charset=utf-8"
                    });
                    res.end("Unable to load students.");
                    return;
                }

                const rows = results.map(student => `
    <tr>
        <td>${student.id}</td>
        <td>${student.name}</td>
        <td>${student.email}</td>
        <td>${student.mobile}</td>
        <td>
            <form action="/edit-student" method="POST">
                <input type="hidden" name="id" value="${student.id}">
                <input type="text" name="name" value="${student.name}" required>
                <input type="email" name="email" value="${student.email}" required>
                <input type="text" name="mobile" value="${student.mobile}" required>
                <button type="submit">Update</button>
            </form>

            <form action="/delete-student" method="POST"
                  onsubmit="return confirm('Delete this student?');">
                <input type="hidden" name="id" value="${student.id}">
                <button type="submit">Delete</button>
            </form>
        </td>
    </tr>
`).join("");

                res.writeHead(200, {
                    "Content-Type": "text/html; charset=utf-8"
                });
                res.end(`
                    <h1>Registered Students</h1>
                    <table border="1" cellpadding="10">
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Mobile</th>
                            <th>Actions</th>
                        </tr>
                        ${rows}
                    </table>
                    <br>
                    <a href="/admin-dashboard.html">Back to Dashboard</a>
                `);
            }
        );

        return;
    }

    // View All Courses
    if (req.method === "GET" && req.url === "/view-courses.html") {
        db.query(
            "SELECT * FROM courses",
            (err, results) => {
                if (err) {
                    console.log("Courses error:", err.message);
                    res.writeHead(500, {
                        "Content-Type": "text/html; charset=utf-8"
                    });
                    res.end("Unable to load courses.");
                    return;
                }

                const rows = results.map(course => `
                    <tr>
                        <td>${course.course_name}</td>
                        <td>${course.description}</td>
                        <td>${course.duration}</td>
                        <td>${course.price}</td>
                    </tr>
                `).join("");

                res.writeHead(200, {
                    "Content-Type": "text/html; charset=utf-8"
                });
                res.end(`
                    <h1>All Courses</h1>
                    <table border="1" cellpadding="10">
                        <tr>
                            <th>Course Name</th>
                            <th>Description</th>
                            <th>Duration</th>
                            <th>Price</th>
                        </tr>
                        ${rows}
                    </table>
                    <br>
                    <a href="/admin-dashboard.html">Back to Dashboard</a>
                `);
            }
        );

        return;
    }

    // View Enrollments
    if (req.method === "GET" && req.url === "/view-enrollments.html") {
        db.query("SELECT * FROM enrollments", (err, results) => {
            if (err) {
                console.log("Enrollments error:", err.message);
                res.writeHead(500, {
                    "Content-Type": "text/html; charset=utf-8"
                });
                res.end("Unable to load enrollments. Check the enrollment table.");
                return;
            }

            const rows = results.map(item => `
                <tr>
                    ${Object.values(item).map(value =>
                        `<td>${value === null ? "" : value}</td>`
                    ).join("")}
                </tr>
            `).join("");

            const headers = results.length
                ? Object.keys(results[0]).map(key => `<th>${key}</th>`).join("")
                : "<th>No enrollment records yet</th>";

            res.writeHead(200, {
                "Content-Type": "text/html; charset=utf-8"
            });
            res.end(`
                <h1>Course Enrollments</h1>
                <table border="1" cellpadding="10">
                    <tr>${headers}</tr>
                    ${rows}
                </table>
                <br>
                <a href="/admin-dashboard.html">Back to Dashboard</a>
            `);
        });

        return;
    }

    // Student Login
    if (req.method === "POST" && req.url === "/login") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const formData = new URLSearchParams(body);
            const email = formData.get("email");
            const password = formData.get("password");

            const sql = `
                SELECT id, name, email
                FROM students
                WHERE email = ? AND password = ?
            `;

            db.query(sql, [email, password], (err, results) => {
                if (err) {
                    console.log("Login error:", err.message);
                    res.writeHead(500, {
                        "Content-Type": "text/html; charset=utf-8"
                    });
                    res.end("Login failed. Please try again.");
                    return;
                }

               if (results.length > 0) {
    const student = results[0];

    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
    });

    res.end(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Login Successful</title>
        </head>
        <body>
            <script>
                localStorage.setItem(
                    "studentId",
                    "${student.id}"
                );
                window.location.href = "/courses.html";
            </script>
        </body>
        </html>
    `);
}
                else {
                    res.writeHead(401, {
                        "Content-Type": "text/html; charset=utf-8"
                    });
                    res.end(`
                        <h2>Invalid Email or Password</h2>
                        <a href="/Login.html">Try Again</a>
                    `);
                }
            });
        });

        return;
    }
// Admin: Add Student
    if (req.method === "POST" && req.url === "/add-student") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const data = new URLSearchParams(body);
            const name = data.get("name");
            const email = data.get("email");
            const mobile = data.get("mobile");
            const password = data.get("password");

            if (!name || !email || !mobile || !password) {
                res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
                res.end('Missing student details. <a href="/admin-dashboard.html">Back</a>');
                return;
            }

            db.query(
                "INSERT INTO students (name, email, mobile, password) VALUES (?, ?, ?, ?)",
                [name, email, mobile, password],
                err => {
                    if (err) {
                        console.log("Add student error:", err.message);
                        res.writeHead(500, { "Content-Type": "text/html; charset=utf-8" });
                        res.end('Unable to add student. Email may already exist. <a href="/admin-dashboard.html">Back</a>');
                        return;
                    }

                    res.writeHead(302, { Location: "/view-students.html" });
                    res.end();
                }
            );
        });

        return;
    }

    // Admin: Edit Student
    if (req.method === "POST" && req.url === "/edit-student") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const data = new URLSearchParams(body);
            const id = Number(data.get("id"));
            const name = data.get("name");
            const email = data.get("email");
            const mobile = data.get("mobile");

            if (!Number.isInteger(id) || id <= 0 || !name || !email || !mobile) {
                res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
                res.end("Invalid student details.");
                return;
            }

            db.query(
                "UPDATE students SET name = ?, email = ?, mobile = ? WHERE id = ?",
                [name, email, mobile, id],
                err => {
                    if (err) {
                        console.log("Edit student error:", err.message);
                        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
                        res.end("Unable to update student.");
                        return;
                    }

                    res.writeHead(302, { Location: "/view-students.html" });
                    res.end();
                }
            );
        });

        return;
    }

    // Admin: Delete Student
    if (req.method === "POST" && req.url === "/delete-student") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const data = new URLSearchParams(body);
            const id = Number(data.get("id"));

            if (!Number.isInteger(id) || id <= 0) {
                res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
                res.end("Invalid student ID.");
                return;
            }

            db.query(
                "DELETE FROM enrollments WHERE student_id = ?",
                [id],
                err => {
                    if (err) {
                        console.log("Delete enrollment error:", err.message);
                        res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
                        res.end("Unable to delete student enrollment.");
                        return;
                    }
                    db.query(
            "DELETE FROM students WHERE id = ?",
            [id],
            err => {
                if (err) {
                    console.log("Delete student error:", err.message);
                    res.writeHead(500, {
                        "Content-Type": "text/plain; charset=utf-8"
                    });
                    res.end("Unable to delete student.");
                    return;
                }

                    res.writeHead(302, { Location: "/view-students.html" });
                    res.end();
                }
            );
        }
    );
});
    return;
}

    // Student Registration
    if (req.method === "POST" && req.url === "/register") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            const formData = new URLSearchParams(body);

            const name = formData.get("name");
            const email = formData.get("email");
            const mobile = formData.get("mobile");
            const password = formData.get("password");
            const confirmPassword = formData.get("confirmpassword");

            if (password !== confirmPassword) {
                res.writeHead(400, {
                    "Content-Type": "text/html; charset=utf-8"
                });
                res.end(`
                    <h2>Passwords do not match</h2>
                    <a href="/register.html">Go Back</a>
                `);
                return;
            }

            const sql = `
                INSERT INTO students (name, email, mobile, password)
                VALUES (?, ?, ?, ?)
            `;

            db.query(sql, [name, email, mobile, password], err => {
                if (err) {
                    console.log("Registration error:", err.message);
                    res.writeHead(500, {
                        "Content-Type": "text/html; charset=utf-8"
                    });
                    res.end(`
                        <h2>Registration Failed</h2>
                        <p>Email may already exist, or the database has an error.</p>
                        <a href="/register.html">Go Back</a>
                    `);
                    return;
                }

                res.writeHead(200, {
                    "Content-Type": "text/html; charset=utf-8"
                });
                res.end(`
                    <h2>Registration Successful!</h2>
                    <p>Your account has been created.</p>
                    <a href="/Login.html">Go to Login</a>
                `);
            });
        });

        return;
    }

// Student Course Enrollment
    if (req.method === "POST" && req.url === "/enroll") {
        let body = "";

        req.on("data", chunk => {
            body += chunk.toString();
        });

        req.on("end", () => {
            try {
                const data = JSON.parse(body);

                // Accept both naming formats
                const studentId = Number(
                    data.studentId || data.student_id
                );

                const courseId = Number(
                    data.courseId || data.course_id
                );

                if (!Number.isInteger(studentId) || studentId <= 0 ||
                    !Number.isInteger(courseId) || courseId <= 0) {
                    res.writeHead(400, {
                        "Content-Type": "text/plain; charset=utf-8"
                    });
                    res.end("Please enter valid Student ID and Course ID.");
                    return;
                }

                // Check that the student and course exist
                const checkSql = `
                    SELECT
                        (SELECT COUNT(*) FROM students WHERE id = ?) AS studentCount,
                        (SELECT COUNT(*) FROM courses WHERE id = ?) AS courseCount
                `;

                db.query(checkSql, [studentId, courseId], (err, results) => {
                    if (err) {
                        console.log("Enrollment check error:", err.message);
                        res.writeHead(500, {
                            "Content-Type": "text/plain; charset=utf-8"
                        });
                        res.end("Unable to verify student and course.");
                        return;
                    }

                    if (results[0].studentCount === 0 ||
                        results[0].courseCount === 0) {
                        res.writeHead(400, {
                            "Content-Type": "text/plain; charset=utf-8"
                        });
                        res.end("Student ID or Course ID not found.");
                        return;
                    }

                    const sql = `
                        INSERT INTO enrollments
                        (student_id, course_id, enrollment_date)
                        VALUES (?, ?, NOW())
                    `;

                    db.query(sql, [studentId, courseId], err => {
                        if (err) {
                            console.log("Enrollment error:", err.message);
                            res.writeHead(500, {
                                "Content-Type": "text/plain; charset=utf-8"
                            });
                            res.end("Enrollment failed. Please check the database.");
                            return;
                        }

                        res.writeHead(200, {
                            "Content-Type": "text/plain; charset=utf-8"
                        });
                        res.end("Course enrollment successful!");
                    });
                });
            } catch (error) {
                res.writeHead(400, {
                    "Content-Type": "text/plain; charset=utf-8"
                });
                res.end("Invalid enrollment data.");
            }
        });

        return;
    }
         
              
// Get all available courses
if (req.method === "GET" && req.url === "/api/courses") {
    db.query("SELECT * FROM courses", (err, results) => {
        if (err) {
            console.log("Courses error:", err.message);
            res.writeHead(500, {
                "Content-Type": "application/json"
            });
            res.end(JSON.stringify({ error: "Unable to load courses" }));
            return;
        }

        res.writeHead(200, {
            "Content-Type": "application/json"
        });
        res.end(JSON.stringify(results));
    });

    return;
}

    // Open HTML and CSS files
    const pathname = new URL(req.url, "http://localhost:3000").pathname;
    const requestedPath = pathname === "/" ? "/index.html" : pathname;
    const filePath = path.join(__dirname, requestedPath.replace(/^\/+/, ""));

    const extname = path.extname(filePath).toLowerCase();

    const contentTypes = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8"
    };

    console.log("Requesting file:",filePath);
    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404, {
                "Content-Type": "text/html; charset=utf-8"
            });
            res.end(`
                <h2>Page Not Found</h2>
                <a href="/index.html">Go to Home</a>
            `);
            return;
        }

        res.writeHead(200, {
            "Content-Type": contentTypes[extname] || "application/octet-stream"
        });
        res.end(content);
    });
});
    // Start Server
server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});

