using System;

namespace ModelStore.Models
{
    public class Customer
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string PhoneNumber { get; set; }
        public string? PasswordHash { get; set; }
        public string Role { get; set; } = "customer";
        public DateTime CreatedAt { get; set; }
    }
}
