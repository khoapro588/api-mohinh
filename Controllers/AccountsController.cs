using Microsoft.AspNetCore.Mvc;
using System.Net;
using System.Net.Mail;
using System.Collections.Generic;
using System.Linq;
using ModelStore.Data;
using ModelStore.Models;
using BCrypt.Net;

namespace ModelStore.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AccountsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        // Bộ nhớ tạm lưu OTP (Thực tế nên dùng Database hoặc Redis)
        private static Dictionary<string, string> OtpStorage = new Dictionary<string, string>();

        public AccountsController(ApplicationDbContext context)
        {
            _context = context;
        }

        public class RegisterRequest
        {
            public string FullName { get; set; }
            public string Email { get; set; }
            public string Password { get; set; }
        }

        [HttpPost("register")]
        public IActionResult Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrEmpty(request.Email) || string.IsNullOrEmpty(request.Password))
                return BadRequest(new { message = "Vui lòng nhập đầy đủ email và mật khẩu." });

            var existingUser = _context.Customers.FirstOrDefault(c => c.Email == request.Email);
            if (existingUser != null)
                return BadRequest(new { message = "Email này đã được sử dụng." });

            var customer = new Customer
            {
                FullName = request.FullName,
                Email = request.Email,
                PhoneNumber = "",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                CreatedAt = System.DateTime.UtcNow
            };

            _context.Customers.Add(customer);
            _context.SaveChanges();

            return Ok(new { message = "Đăng ký thành công." });
        }

        public class LoginRequest
        {
            public string Email { get; set; }
            public string Password { get; set; }
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            // Tài khoản admin hardcode
            if (request.Email?.Trim().ToLower() == "admin@gmail.com" && request.Password?.Trim() == "123")
            {
                return Ok(new { 
                    message = "Đăng nhập admin thành công.",
                    user = new { Id = 0, FullName = "Administrator", Email = "admin@gmail.com", Role = "admin" }
                });
            }

            var user = _context.Customers.FirstOrDefault(c => c.Email == request.Email);
            
            if (user == null || string.IsNullOrEmpty(user.PasswordHash) || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return BadRequest(new { message = "Email hoặc mật khẩu không chính xác." });
            }

            // Thực tế sẽ trả về JWT Token ở đây
            return Ok(new { 
                message = "Đăng nhập thành công.",
                user = new { user.Id, user.FullName, user.Email, Role = "customer" }
            });
        }

        public class ForgotPasswordRequest
        {
            public string ContactInfo { get; set; } // Email hoặc SĐT
        }

        [HttpPost("forgot-password")]
        public IActionResult ForgotPassword([FromBody] ForgotPasswordRequest request)
        {
            if (string.IsNullOrEmpty(request.ContactInfo))
                return BadRequest(new { message = "Thông tin không hợp lệ." });

            // Tìm user bằng Email hoặc Phone
            var user = _context.Customers.FirstOrDefault(c => c.Email == request.ContactInfo || c.PhoneNumber == request.ContactInfo);
            if (user == null)
            {
                return BadRequest(new { message = "Không tìm thấy tài khoản với thông tin này." });
            }

            var otp = new System.Random().Next(100000, 999999).ToString();
            OtpStorage[request.ContactInfo] = otp;

            // Kiểm tra xem ContactInfo là Email hay SĐT
            if (request.ContactInfo.Contains("@"))
            {
                // Gửi Email
                try
                {
                    var senderEmail = "kennopro588@gmail.com"; 
                    var senderAppPassword = "kylgogvjtddlbnuk"; 
                    var client = new SmtpClient("smtp.gmail.com", 587)
                    {
                        EnableSsl = true,
                        UseDefaultCredentials = false,
                        Credentials = new NetworkCredential(senderEmail, senderAppPassword)
                    };
                    var mailMessage = new MailMessage
                    {
                        From = new MailAddress(senderEmail, "ModelStore Support"),
                        Subject = "Mã xác thực OTP - Khôi phục mật khẩu",
                        Body = $"Xin chào,\n\nMã OTP khôi phục mật khẩu của bạn là: {otp}\n\nTrân trọng,\nĐội ngũ quản trị.",
                    };
                    mailMessage.To.Add(request.ContactInfo);
                    client.Send(mailMessage);
                    return Ok(new { message = "Mã OTP đã được gửi đến email của bạn." });
                }
                catch (System.Exception ex)
                {
                    return StatusCode(500, new { message = "Lỗi khi gửi email.", error = ex.Message });
                }
            }
            else
            {
                // Gửi SMS giả lập (Log ra console)
                System.Console.WriteLine($"[SMS MOCK] Sending OTP {otp} to phone number {request.ContactInfo}");
                return Ok(new { message = "Mã OTP đã được gửi đến số điện thoại của bạn qua SMS." });
            }
        }

        public class VerifyOtpRequest
        {
            public string ContactInfo { get; set; }
            public string Otp { get; set; }
        }

        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp([FromBody] VerifyOtpRequest request)
        {
            if (OtpStorage.ContainsKey(request.ContactInfo) && OtpStorage[request.ContactInfo] == request.Otp)
                return Ok(new { message = "Xác thực thành công." });

            return BadRequest(new { message = "Mã OTP không chính xác." });
        }

        public class ResetPasswordRequest
        {
            public string ContactInfo { get; set; }
            public string NewPassword { get; set; }
        }

        [HttpPost("reset-password")]
        public IActionResult ResetPassword([FromBody] ResetPasswordRequest request)
        {
            var user = _context.Customers.FirstOrDefault(c => c.Email == request.ContactInfo || c.PhoneNumber == request.ContactInfo);
            if (user == null) return BadRequest(new { message = "Không tìm thấy người dùng." });

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            _context.SaveChanges();

            if (OtpStorage.ContainsKey(request.ContactInfo))
                OtpStorage.Remove(request.ContactInfo);

            return Ok(new { message = "Đổi mật khẩu thành công." });
        }
        [HttpGet("users")]
        public IActionResult GetUsers()
        {
            var users = _context.Customers.Select(c => new { c.Id, c.FullName, c.Email, c.PhoneNumber, c.Role, c.CreatedAt }).ToList();
            return Ok(users);
        }

        public class UpdateUserRequest
        {
            public string FullName { get; set; }
            public string Email { get; set; }
            public string Role { get; set; }
            public string? Password { get; set; } // Nếu có nhập pass mới thì đổi pass
        }

        [HttpPost("users")]
        public IActionResult CreateUser([FromBody] UpdateUserRequest request)
        {
            if (_context.Customers.Any(c => c.Email == request.Email))
                return BadRequest(new { message = "Email đã tồn tại." });

            var customer = new Customer
            {
                FullName = request.FullName,
                Email = request.Email,
                PhoneNumber = "",
                Role = request.Role,
                CreatedAt = System.DateTime.UtcNow,
                PasswordHash = string.IsNullOrEmpty(request.Password) ? BCrypt.Net.BCrypt.HashPassword("123456") : BCrypt.Net.BCrypt.HashPassword(request.Password)
            };

            _context.Customers.Add(customer);
            _context.SaveChanges();

            return Ok(customer);
        }

        [HttpPut("users/{id}")]
        public IActionResult UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            var user = _context.Customers.FirstOrDefault(c => c.Id == id);
            if (user == null) return NotFound();

            user.FullName = request.FullName;
            user.Email = request.Email;
            user.Role = request.Role;

            if (!string.IsNullOrEmpty(request.Password))
            {
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            }

            _context.SaveChanges();
            return Ok(new { message = "Cập nhật người dùng thành công" });
        }

        [HttpDelete("users/{id}")]
        public IActionResult DeleteUser(int id)
        {
            var user = _context.Customers.FirstOrDefault(c => c.Id == id);
            if (user == null) return NotFound();

            _context.Customers.Remove(user);
            _context.SaveChanges();
            return Ok(new { message = "Đã xóa người dùng" });
        }
    }
}
