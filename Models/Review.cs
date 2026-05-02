namespace ModelStore.Models
{
    public class Review
    {
        public int Id { get; set; }
        public int ModelId { get; set; }
        public string ReviewerName { get; set; }
        public string Content { get; set; }
        public int Rating { get; set; }
    }
}
