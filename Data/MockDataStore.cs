using System;
using System.Collections.Generic;
using ModelStore.Models;

namespace ModelStore.Data
{
    public static class MockDataStore
    {
        public static List<FigureModel> Models = new List<FigureModel>
        {
            new FigureModel { Id = 1, Name = "Gundam RX-78-2", Category = "Mecha", Brand = "Bandai", Price = 50.00m, Stock = 10, IsFeatured = true, IsOnSale = false, ImageUrl = "https://images.unsplash.com/photo-1596704017254-9b121068fb31?q=80&w=600&auto=format&fit=crop" },
            new FigureModel { Id = 2, Name = "Optimus Prime", Category = "Transformers", Brand = "Hasbro", Price = 80.00m, Stock = 5, IsFeatured = true, IsOnSale = true, ImageUrl = "https://images.unsplash.com/photo-1627856013091-fed6e4e047c5?q=80&w=600&auto=format&fit=crop" },
            new FigureModel { Id = 3, Name = "Iron Man Mark 85", Category = "Marvel", Brand = "Hot Toys", Price = 300.00m, Stock = 2, IsFeatured = false, IsOnSale = false, ImageUrl = "https://images.unsplash.com/photo-1608889175123-8ee362201f81?q=80&w=600&auto=format&fit=crop" },
            new FigureModel { Id = 4, Name = "Naruto Uzumaki", Category = "Anime", Brand = "Banpresto", Price = 25.00m, Stock = 20, IsFeatured = true, IsOnSale = true, ImageUrl = "https://images.unsplash.com/photo-1611004652251-4043b8a368fc?q=80&w=600&auto=format&fit=crop" }
        };

        public static List<Review> Reviews = new List<Review>
        {
            new Review { Id = 1, ModelId = 1, ReviewerName = "John Doe", Content = "Great model!", Rating = 5 }
        };

        public static List<Customer> Customers = new List<Customer>
        {
            new Customer { Id = 1, FullName = "Alice Smith", Email = "alice@example.com", PhoneNumber = "123-456-7890", CreatedAt = DateTime.Now.AddDays(-10) }
        };

        public static List<Order> Orders = new List<Order>();
        public static List<Cart> Carts = new List<Cart>();
    }
}
