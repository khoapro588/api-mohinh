using System.Collections.Generic;

namespace ModelStore.Models
{
    public class Cart
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public List<CartItem> Items { get; set; } = new List<CartItem>();
    }

    public class CartItem
    {
        public int Id { get; set; }
        public int CartId { get; set; }
        public int ModelId { get; set; }
        public int Quantity { get; set; }
    }
}
